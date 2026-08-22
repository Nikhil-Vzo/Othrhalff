import express from 'express';
import webpush from 'web-push';
import { verifySupabaseToken } from '../middleware/auth.js';
import { redis, isConnected, cacheSet, cacheGet } from '../lib/redis.js';

const router = express.Router();

// Generate default VAPID keys if env vars are missing
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  // SCALING FIX: keys generated per-boot invalidate every previously stored
  // push subscription on each restart/deploy. Log loudly so ops sets the
  // persistent VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars in Render.
  const generatedKeys = webpush.generateVAPIDKeys();
  vapidPublicKey = generatedKeys.publicKey;
  vapidPrivateKey = generatedKeys.privateKey;
  console.warn('[Web Push] WARNING: VAPID keys generated per-session. All push subscriptions will be INVALID after restart. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the environment for persistent subscriptions.');
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
// SECURITY FIX: previously ANY authenticated user could send arbitrary
// title/body/url pushes to ANY user (phishing primitive). Now the sender must
// be the target themself (self-reminder flows) or present the admin secret.
// Server-generated notifications (matches/messages) are delivered by trusted
// server code, never through this client-facing endpoint.
router.post('/push/send', verifySupabaseToken, async (req, res) => {
  try {
    const { targetUserId, title, body, icon, url, metadata } = req.body;

    if (!targetUserId || !title) {
      return res.status(400).json({ error: 'Missing targetUserId or title' });
    }

    const adminSecret = req.headers['x-admin-secret'];
    const isAdminCaller = !!(
      process.env.ADMIN_SECRET_KEY &&
      adminSecret &&
      adminSecret === process.env.ADMIN_SECRET_KEY
    );

    if (!isAdminCaller && req.userId !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden: You may only send push notifications to yourself' });
    }

    // Never allow client-supplied redirect URLs — pin to the official origin.
    const SAFE_URL = 'https://www.othrhalff.in';
    const safeUrl = typeof url === 'string' && url.startsWith(SAFE_URL) ? url : SAFE_URL;

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
        ...metadata,
        // FIX: pin AFTER the spread so metadata can never override the URL
        url: safeUrl
      }
    });

    await webpush.sendNotification(subscription, payload);
    res.json({ success: true, message: 'Push notification sent' });

  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. BROADCAST Web Push Notification to ALL Subscribed Users (Admin Protected)
router.post('/push/broadcast', verifySupabaseToken, async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Forbidden: Invalid or missing Admin Secret Key' });
    }

    const { title, body, icon, url, metadata } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Missing title or body for broadcast' });
    }

    const subscriptions = [];

    // Collect subscriptions from Redis if connected
    if (redis && isConnected) {
      try {
        // SCALING FIX: redis.keys() is O(N) and blocks the single-threaded
        // Redis instance (stalls rate limiting for ALL requests). Use SCAN.
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'push_sub:*', 'COUNT', 100);
          cursor = nextCursor;
          for (const key of keys) {
            const raw = await redis.get(key);
            if (raw) {
              try { subscriptions.push(JSON.parse(raw)); } catch (e) {}
            }
          }
        } while (cursor !== '0');
      } catch (e) {
        console.warn('[Broadcast] Error reading Redis push keys:', e);
      }
    }

    // Also collect local in-memory fallback subscriptions
    for (const sub of localSubscriptions.values()) {
      if (sub && !subscriptions.some(s => s.endpoint === sub.endpoint)) {
        subscriptions.push(sub);
      }
    }

    if (subscriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'No active push subscribers found' });
    }

    const payload = JSON.stringify({
      title: title || '🔥 Campus Alert | Othrhalff',
      body: body,
      icon: icon || '/favicon.png',
      metadata: {
        url: url || 'https://www.othrhalff.in',
        ...metadata
      }
    });

    // Send push notification to ALL subscribers in parallel
    const results = await Promise.allSettled(
      subscriptions.map(sub => webpush.sendNotification(sub, payload))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      message: `Broadcast complete! Sent to ${successful} users (${failed} failed / expired).`,
      totalSubscribers: subscriptions.length,
      successful,
      failed
    });

  } catch (error) {
    console.error('Error broadcasting push notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

