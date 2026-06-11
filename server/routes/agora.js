import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { verifySupabaseToken } from '../middleware/auth.js';

const router = express.Router();

// Generate RTC Token for general video/audio call
router.post('/agora-token', verifySupabaseToken, async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate a unique channel name for this call
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use uid 0 (auto-assign)
    const uid = 0;

    // Token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token with publisher role
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      token,
      channelName,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate RTC Token for initiating a call session
router.post('/initiate-call', verifySupabaseToken, async (req, res) => {
  try {
    const { receiverId, matchId } = req.body;

    if (!receiverId || !matchId) {
      return res.status(400).json({ error: 'receiverId and matchId are required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate unique channel name
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = 0;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      channelName,
      token,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
