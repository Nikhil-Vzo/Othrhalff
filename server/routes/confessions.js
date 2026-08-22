import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';
import { cacheDelete, cacheGet, cacheSet, cacheSetOnce } from '../lib/redis.js';

const router = express.Router();

/**
 * Guest proxy profile ID (representing a placeholder "Guest" user profile)
 * This static UUID is used to satisfy the database foreign key constraint
 * in confessions.user_id referencing profiles.id for unlogged users.
 */
const GUEST_PROXY_PROFILE_ID = 'a3e96230-6a78-4215-bcd0-882e1af61127';
const GUEST_CONFESSION_DEDUPE_TTL_SECONDS = 120;
const GUEST_CONFESSION_LOCK_TTL_SECONDS = 30;

function normalizePollOptions(pollOptions) {
  if (!Array.isArray(pollOptions)) return [];
  return pollOptions.map(option => String(option).trim()).filter(Boolean);
}

/**
 * Extract a robust composite client fingerprint (IP + Client Token / Fingerprint + User-Agent)
 * to avoid blocking entire dorms/campuses sharing a single NAT gateway.
 */
function getCompositeClientIdentifier(req) {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
    .split(',')[0]
    .trim();
  const guestHeader = req.headers['x-guest-fingerprint'] || req.headers['x-client-fingerprint'] || '';
  const userAgent = req.headers['user-agent'] || '';
  
  return crypto
    .createHash('sha256')
    .update(`${clientIp}:${guestHeader}:${userAgent}`)
    .digest('hex')
    .substring(0, 32);
}

function guestConfessionFingerprint(clientId, payload) {
  const normalizedPayload = {
    clientId,
    college: String(payload.college || '').trim().substring(0, 100),
    branch: String(payload.branch || '').trim().substring(0, 100),
    text: String(payload.text || '').trim().substring(0, 2000),
    imageUrl: String(payload.imageUrl || '').trim(),
    videoUrl: String(payload.videoUrl || '').trim(),
    type: String(payload.type || '').trim(),
    pollOptions: normalizePollOptions(payload.pollOptions)
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedPayload))
    .digest('hex');
}

// Post Guest Confession API (Strictly allow-listed payload, bypasses RLS safely)
router.post('/post-guest-confession', async (req, res) => {
  const compositeId = getCompositeClientIdentifier(req);
  const fingerprint = guestConfessionFingerprint(compositeId, req.body);
  const responseCacheKey = `guest_confession:response:${fingerprint}`;
  const lockKey = `guest_confession:lock:${fingerprint}`;
  let lockAcquired = false;

  try {
    const cachedResponse = await cacheGet(responseCacheKey);
    if (cachedResponse) {
      return res.json({ ...cachedResponse, deduped: true });
    }

    lockAcquired = await cacheSetOnce(lockKey, { startedAt: Date.now() }, GUEST_CONFESSION_LOCK_TTL_SECONDS);
    if (!lockAcquired && await cacheGet(lockKey)) {
      return res.status(409).json({
        error: 'Duplicate confession submission is already being processed',
        retryable: true
      });
    }

    // 1. Strict Payload Sanitization & Allow-listing (No raw body spread)
    const rawText = String(req.body.text || '').trim();
    if (!rawText && !req.body.imageUrl && !req.body.videoUrl) {
      return res.status(400).json({ error: 'Confession content cannot be empty' });
    }
    if (rawText.length > 2500) {
      return res.status(400).json({ error: 'Confession text exceeds 2500 characters limit' });
    }

    const sanitizedCollege = String(req.body.college || 'Guest').replace(/[\r\n\t]/g, '').trim().substring(0, 100);
    const sanitizedBranch = String(req.body.branch || 'General').replace(/[\r\n\t]/g, '').trim().substring(0, 100);
    
    // Type allow-listing
    const rawType = String(req.body.type || 'text').toLowerCase();
    const allowedTypes = ['text', 'poll', 'video'];
    let finalType = allowedTypes.includes(rawType) ? rawType : 'text';

    // 2. Strict media URL validation for security (Supabase storage only)
    const rawMedia = req.body.videoUrl || req.body.imageUrl;
    let validatedMediaUrl = null;
    if (rawMedia) {
      try {
        const parsed = new URL(String(rawMedia));
        if (
          parsed.hostname.endsWith('.supabase.co') &&
          parsed.pathname.includes('/storage/v1/object/public/confession-media/')
        ) {
          validatedMediaUrl = parsed.toString();
          if (req.body.videoUrl) finalType = 'video';
        } else {
          return res.status(400).json({ error: 'Invalid or unauthorized media storage URL' });
        }
      } catch (e) {
        return res.status(400).json({ error: 'Malformed media URL' });
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Explicitly construct Database record (immune to object injection)
    const dbPayload = {
      user_id: GUEST_PROXY_PROFILE_ID,
      university: `${sanitizedCollege}|${sanitizedBranch}`,
      text: rawText,
      image_url: validatedMediaUrl,
      type: finalType
    };

    const { data: post, error } = await supabase
      .from('confessions')
      .insert(dbPayload)
      .select().single();

    if (error) throw error;

    // 4. Handle nested poll options if poll type
    if (finalType === 'poll' && post && Array.isArray(req.body.pollOptions)) {
      const sanitizedOptions = normalizePollOptions(req.body.pollOptions)
        .slice(0, 4) // Max 4 poll choices
        .map(optText => ({
          confession_id: post.id,
          text: optText.substring(0, 100)
        }));

      if (sanitizedOptions.length >= 2) {
        const { error: pollError } = await supabase.from('poll_options').insert(sanitizedOptions);
        if (pollError) {
          await supabase.from('confessions').delete().eq('id', post.id).catch(delErr => {
            console.error('Failed to clean up confession after poll option insert failure:', delErr);
          });
          throw pollError;
        }
      }
    }

    // Fetch the final merged post including poll options
    const { data: finalPost, error: fetchError } = await supabase
      .from('confessions')
      .select('*, poll_options(*)')
      .eq('id', post.id)
      .single();

    if (fetchError) throw fetchError;

    const responseBody = { success: true, post: finalPost };
    await cacheSet(responseCacheKey, responseBody, GUEST_CONFESSION_DEDUPE_TTL_SECONDS);

    res.json(responseBody);

  } catch (error) {
    if (lockAcquired) {
      await cacheDelete(lockKey);
    }
    console.error('Error posting guest confession:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sign Media Upload URL endpoint with rate-limiting and validation
router.post('/sign-media-upload', async (req, res) => {
  try {
    // Media Upload Rate Limiting (Max 10 uploads per 10 minutes per client)
    const compositeId = getCompositeClientIdentifier(req);
    const mediaRateLimitKey = `rate_limit:media_sign:${compositeId}`;
    const currentUploads = await cacheGet(mediaRateLimitKey);

    if (currentUploads && currentUploads.count >= 10) {
      return res.status(429).json({
        error: 'Too many media upload requests. Please wait a few minutes before trying again.'
      });
    }

    const newCount = (currentUploads?.count || 0) + 1;
    await cacheSet(mediaRateLimitKey, { count: newCount }, 600); // 10 min window

    const { fileExt } = req.body;
    const ext = String(fileExt || 'mp4').toLowerCase().replace(/^\./, '');
    const allowedExts = ['mp4', 'webm', 'mov', 'png', 'jpg', 'jpeg', 'webp'];
    
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file extension .${ext}` });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase admin credentials missing on server');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const folder = ['mp4', 'webm', 'mov'].includes(ext) ? 'videos' : 'images';
    const filePath = `${folder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`;

    const { data, error } = await supabase.storage.from('confession-media').createSignedUploadUrl(filePath);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('confession-media').getPublicUrl(filePath);

    return res.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
      publicUrl
    });
  } catch (err) {
    console.error('Error creating signed upload URL:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate signed upload URL' });
  }
});

export default router;
