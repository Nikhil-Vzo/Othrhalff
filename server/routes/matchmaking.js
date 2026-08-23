import express from 'express';
import pkg from 'agora-access-token';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseToken } from '../middleware/auth.js';

const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();

const DEFAULT_UID = 0;
const GENERAL_TOKEN_TTL_SECONDS = 86400;

function buildAgoraToken(channelName) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return { appId: '', token: '' };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + GENERAL_TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    DEFAULT_UID,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return { appId, token };
}

// In-memory atomic matchmaking queue
const queue = new Map();
// Matched pairings ready for pickup
const matches = new Map();

// Lazy Supabase realtime broadcast client
let supabaseClient = null;
let realtimeChannel = null;

// Normalize university strings so 'IIIT NRR' / 'iiit nrr, chhattisgarh' compare equal.
function normalizeUniversity(univ) {
  return String(univ || '').trim().toLowerCase().split(',')[0].trim();
}

// Blocked-user cache (60s TTL) so we don't hammer Supabase on every pairing check.
let blockedCache = null;

async function getBlockedPairs() {
  if (blockedCache && Date.now() - blockedCache.fetchedAt < 60000) {
    return blockedCache.data;
  }
  const map = new Map();
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const client = supabaseClient || createClient(url, key);
      // Fetch all blocks (small table); build blocker -> set(blocked) adjacency both ways.
      const { data, error } = await client.from('blocked_users').select('blocker_id, blocked_id');
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (!map.has(row.blocker_id)) map.set(row.blocker_id, new Set());
          if (!map.has(row.blocked_id)) map.set(row.blocked_id, new Set());
          map.get(row.blocker_id).add(row.blocked_id);
          map.get(row.blocked_id).add(row.blocker_id);
        }
      }
    }
  } catch (err) {
    console.warn('[Matchmaking] blocked_users fetch failed (pairing without block filter):', err?.message || err);
  }
  blockedCache = { data: map, fetchedAt: Date.now() };
  return map;
}


function getRealtimeChannel() {
  if (realtimeChannel) return realtimeChannel;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Matchmaking] Supabase credentials not found; realtime broadcast unavailable, relying on polling fallback');
    return null;
  }

  try {
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    realtimeChannel = supabaseClient.channel('discover-pool', {
      config: {
        broadcast: { ack: false }
      }
    });
    realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Matchmaking] Realtime discover-pool broadcast channel active on server');
      }
    });
    return realtimeChannel;
  } catch (err) {
    console.warn('[Matchmaking] Failed to init realtime broadcast channel:', err);
    return null;
  }
}

// Warm up realtime connection
setTimeout(() => {
  getRealtimeChannel();
}, 1000);

// Periodic cleanup of stale waiting users (>45s)
setInterval(() => {
  const now = Date.now();
  for (const [userId, item] of queue.entries()) {
    if (now - item.joinedAt > 45000) {
      queue.delete(userId);
    }
  }
  for (const [userId, match] of matches.entries()) {
    if (now - match.createdAt > 30000) {
      matches.delete(userId);
    }
  }
}, 10000);

/**
 * POST /api/matchmaking/queue
 * Server-authoritative atomic matchmaking queue
 */
router.post('/matchmaking/queue', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { name, avatar, university, mode = 'VIDEO', scope = 'GLOBAL', recentPartners = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Normalize once — used for both storing and comparing (fixes exact-string campus bug)
    const myUnivNorm = normalizeUniversity(university);
    const blockedPairs = await getBlockedPairs();
    const myBlocks = blockedPairs.get(userId) || new Set();

    // 1. Check if user already has a pending matched result
    if (matches.has(userId)) {
      const match = matches.get(userId);
      matches.delete(userId);
      return res.json({ status: 'MATCHED', ...match });
    }

    const now = Date.now();

    // 2. Search queue for a compatible partner atomically
    let matchedPartner = null;

    for (const [otherId, other] of queue.entries()) {
      if (otherId === userId) continue;
      if (other.mode !== mode) continue;
      if (myBlocks.has(otherId)) continue;                       // never pair blocked users
      const otherBlocks = blockedPairs.get(otherId);
      if (otherBlocks && otherBlocks.has(userId)) continue;

      // Scope validation on NORMALIZED universities
      if (scope === 'CAMPUS' && myUnivNorm && other.univNorm !== myUnivNorm) continue;
      if (other.scope === 'CAMPUS' && other.univNorm && other.univNorm !== myUnivNorm) continue;

      // Recent partner avoid list
      if (recentPartners.includes(otherId)) continue;
      if (other.recentPartners && other.recentPartners.includes(userId)) continue;

      // TEXT PRIORITY: prefer partners already waiting longest so text chats pair fast,
      // and within same mode prefer earlier joinedAt (FIFO). Video keeps same FIFO.
      if (!matchedPartner || other.joinedAt < matchedPartner.joinedAt) {
        matchedPartner = other;
      }
    }

    if (matchedPartner) {
      queue.delete(matchedPartner.userId);
      const channelName = `discover_${mode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let appId = '';
      let token = '';

      if (mode === 'VIDEO') {
        const agoraCreds = buildAgoraToken(channelName);
        appId = agoraCreds.appId;
        token = agoraCreds.token;
      }

      const matchPayloadForUser = {
        partnerId: matchedPartner.userId,
        partnerName: matchedPartner.name || 'Anonymous Student',
        partnerAvatar: matchedPartner.avatar || '',
        partnerUniversity: matchedPartner.university || '',
        channelName,
        appId,
        token,
        mode,
        createdAt: now
      };

      const matchPayloadForPartner = {
        partnerId: userId,
        partnerName: name || 'Anonymous Student',
        partnerAvatar: avatar || '',
        partnerUniversity: university || '',
        channelName,
        appId,
        token,
        mode,
        createdAt: now
      };

      // 1. Save match for partner to pick up on their next poll (guaranteed fallback)
      matches.set(matchedPartner.userId, matchPayloadForPartner);

      // 2. Instant Realtime Notification to partner via Supabase Realtime broadcast (<50ms latency)
      const channel = getRealtimeChannel();
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'MATCH_FOUND',
          payload: {
            targetId: matchedPartner.userId,
            ...matchPayloadForPartner
          }
        }).catch(err => {
          console.warn('[Matchmaking] Realtime broadcast error (falling back to poll):', err?.message || err);
        });
      }

      return res.json({
        status: 'MATCHED',
        ...matchPayloadForUser
      });
    }

    // 3. No immediate match; register into queue (store normalized university too)
    queue.set(userId, {
      userId,
      name,
      avatar,
      university,
      univNorm: myUnivNorm,
      mode,
      scope,
      recentPartners,
      joinedAt: now
    });

    return res.json({ status: 'SEARCHING' });
  } catch (error) {
    console.error('[Matchmaking Queue Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/matchmaking/leave
 * Cancel searching or leave queue
 */
router.post('/matchmaking/leave', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (userId) {
      queue.delete(userId);
      matches.delete(userId);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
