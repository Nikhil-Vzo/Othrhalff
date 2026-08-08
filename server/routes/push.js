import express from 'express';
import webpush from 'web-push';
import { verifySupabaseToken } from '../middleware/auth.js';
import { cacheSet, cacheGet } from '../lib/redis.js';

const router = express.Router();

// Generate default VAPID keys if env vars are missing
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  const generatedKeys = webpush.generateVAPIDKeys();
  vapidPublicKey = generatedKeys.publicKey;
  vapidPrivateKey = generatedKeys.privateKey;
  console.log('[Web Push] VAPID keys generated automatically for server session.');
}

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@othrhalff.in',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (err) {
  console.warn('[Web Push] Warning initializing VAPID details:', err.message);
}

// In-memory fallback subscriptions map if Redis is not connected
const localSubscriptions = new Map();

// 1. Get Public VAPID Key
router.get('/push/vapid-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// 2. Subscribe user to Web Push
router.post('/push/subscribe', verifySupabaseToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.userId;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Save in Redis if available
    const key = `push_sub:${userId}`;
    const saved = await cacheSet(key, subscription, 30 * 24 * 3600); // 30 days TTL

    if (!saved) {
      localSubscriptions.set(userId, subscription);
    }

    res.json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Send Web Push Notification to a target user
router.post('/push/send', verifySupabaseToken, async (req, res) => {
  try {
    const { targetUserId, title, body, icon, url, metadata } = req.body;

    if (!targetUserId || !title) {
      return res.status(400).json({ error: 'Missing targetUserId or title' });
    }

    // Retrieve subscription from Redis or memory
    const key = `push_sub:${targetUserId}`;
    let subscription = await cacheGet(key);

    if (!subscription) {
      subscription = localSubscriptions.get(targetUserId);
    }

    if (!subscription) {
      return res.status(404).json({ error: 'User push subscription not found' });
    }

    const payload = JSON.stringify({
      title: title || 'Othrhalff Update',
      body: body || 'You have a new notification!',
      icon: icon || '/favicon.png',
      metadata: {
        url: url || 'https://www.othrhalff.in',
        ...metadata
      }
    });

    await webpush.sendNotification(subscription, payload);
    res.json({ success: true, message: 'Push notification sent' });

  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
