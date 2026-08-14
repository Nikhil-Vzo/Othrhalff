import express from 'express';
import pkg from 'agora-access-token';
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

      // Scope validation
      if (scope === 'CAMPUS' && university && other.university !== university) continue;
      if (other.scope === 'CAMPUS' && other.university && other.university !== university) continue;

      // Recent partner avoid list
      if (recentPartners.includes(otherId)) continue;
      if (other.recentPartners && other.recentPartners.includes(userId)) continue;

      // Match found!
      matchedPartner = other;
      queue.delete(otherId);
      break;
    }

    if (matchedPartner) {
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

      // Save match for partner to pick up on their next poll
      matches.set(matchedPartner.userId, matchPayloadForPartner);

      return res.json({
        status: 'MATCHED',
        ...matchPayloadForUser
      });
    }

    // 3. No immediate match; register into queue
    queue.set(userId, {
      userId,
      name,
      avatar,
      university,
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
