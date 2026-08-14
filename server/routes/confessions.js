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

function guestConfessionFingerprint(userId, payload) {
  const normalizedPayload = {
    userId,
    college: String(payload.college || '').trim(),
    branch: String(payload.branch || '').trim(),
    text: String(payload.text || '').trim(),
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

// Post Guest Confession API (uses Service Role Key to bypass RLS)
router.post('/post-guest-confession', verifySupabaseToken, async (req, res) => {
  const fingerprint = guestConfessionFingerprint(req.userId, req.body);
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

    const { college, branch, text, imageUrl, videoUrl, type, pollOptions } = req.body;

    // Strict media URL validation for security
    const mediaUrl = videoUrl || imageUrl;
    if (mediaUrl) {
      try {
        const parsed = new URL(mediaUrl);
        if (!parsed.hostname.endsWith('supabase.co') || !parsed.pathname.includes('/storage/v1/object/public/')) {
          return res.status(400).json({ error: 'Invalid media host URL' });
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

    // Attribute the guest confession to the shared proxy guest profile
    const finalType = videoUrl ? 'video' : (type || 'text');
    const { data: post, error } = await supabase
      .from('confessions')
      .insert({
        user_id: GUEST_PROXY_PROFILE_ID,
        university: `${college}|${branch}`,
        text: text,
        image_url: mediaUrl || null,
        type: finalType
      })
      .select().single();

    if (error) throw error;

    // Handle nested poll options if creating a poll confession
    if (type === 'poll' && post) {
      const optionsToInsert = normalizePollOptions(pollOptions).map(optText => ({
        confession_id: post.id,
        text: optText
      }));
      if (optionsToInsert.length > 0) {
        const { error: pollError } = await supabase.from('poll_options').insert(optionsToInsert);
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

// Sign Media Upload URL endpoint (allows guests and users to upload media directly to Supabase storage bypassing RLS)
router.post('/sign-media-upload', async (req, res) => {
  try {
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
    const filePath = `${folder}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;

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
