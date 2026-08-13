import express from 'express';
import pkg from 'agora-access-token';
import { verifySupabaseToken } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../lib/redis.js';

const { RtcTokenBuilder, RtcRole } = pkg;
const router = express.Router();

const DEFAULT_UID = 0;
const GENERAL_TOKEN_TTL_SECONDS = 86400;
const CALL_TOKEN_TTL_SECONDS = 3600;
const CACHE_SAFETY_WINDOW_SECONDS = 60;

function buildRtcToken({ appId, appCertificate, channelName, uid, expiresInSeconds }) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expiresInSeconds;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );

  return { token, privilegeExpiredTs };
}

function getAgoraCredentials() {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora credentials not configured');
  }

  return { appId, appCertificate };
}

function agoraTokenCacheKey({ channelName, uid, expiresInSeconds }) {
  return `agora:rtc:${channelName}:${uid}:${RtcRole.PUBLISHER}:${expiresInSeconds}`;
}

// Generate RTC Token for general video/audio call
router.post('/agora-token', verifySupabaseToken, async (req, res) => {
  try {
    const { appId, appCertificate } = getAgoraCredentials();
    const channelName = req.body.channelName || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = DEFAULT_UID;
    const cacheKey = agoraTokenCacheKey({ channelName, uid, expiresInSeconds: GENERAL_TOKEN_TTL_SECONDS });

    const cachedToken = await cacheGet(cacheKey);
    if (cachedToken?.token && cachedToken?.privilegeExpiredTs) {
      return res.json({
        token: cachedToken.token,
        channelName,
        appId,
        uid: uid.toString(),
        expiresAt: cachedToken.privilegeExpiredTs,
        cached: true
      });
    }

    const { token, privilegeExpiredTs } = buildRtcToken({
      appId,
      appCertificate,
      channelName,
      uid,
      expiresInSeconds: GENERAL_TOKEN_TTL_SECONDS
    });

    await cacheSet(
      cacheKey,
      { token, privilegeExpiredTs },
      Math.max(1, GENERAL_TOKEN_TTL_SECONDS - CACHE_SAFETY_WINDOW_SECONDS)
    );

    res.json({
      token,
      channelName,
      appId,
      uid: uid.toString(),
      expiresAt: privilegeExpiredTs,
      cached: false
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate RTC Token for initiating a call session
router.post('/initiate-call', verifySupabaseToken, async (req, res) => {
  try {
    const { appId, appCertificate } = getAgoraCredentials();
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = DEFAULT_UID;
    const { token, privilegeExpiredTs } = buildRtcToken({
      appId,
      appCertificate,
      channelName,
      uid,
      expiresInSeconds: CALL_TOKEN_TTL_SECONDS
    });

    res.json({
      channelName,
      token,
      appId,
      uid: uid.toString(),
      expiresAt: privilegeExpiredTs
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
