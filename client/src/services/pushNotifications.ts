/**
 * Utility to convert base64 VAPID key to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://testing-of.onrender.com';

/**
 * Registers Web Push Notification Subscription for current logged-in user
 */
export async function subscribeToPushNotifications(authToken: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Web Push] Push notifications are not supported in this browser.');
    return false;
  }

  try {
    // 1. Request notification permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Web Push] User declined notification permission.');
      return false;
    }

    // 2. Ensure Service Worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Fetch VAPID Public Key from backend API
    const keyRes = await fetch(`${SERVER_URL}/api/push/vapid-key`);
    if (!keyRes.ok) throw new Error('Failed to fetch VAPID key');
    const { publicKey } = await keyRes.json();

    // 4. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 5. Send Push Subscription to Backend Server
    const subRes = await fetch(`${SERVER_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!subRes.ok) throw new Error('Failed to register subscription with server');

    console.log('[Web Push] Successfully subscribed to Push Notifications!');
    return true;

  } catch (error) {
    console.error('[Web Push] Subscription error:', error);
    return false;
  }
}
