import webpush from 'web-push';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';

// Configure VAPID details for web-push
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      env.VAPID_EMAIL || 'mailto:support@vartiq.com',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.warn('⚠️ WebPush VAPID setup warning:', err.message);
  }
}

/**
 * Compute SHA-256 hash of an endpoint for safe MySQL indexing
 */
export const hashEndpoint = (endpoint) => {
  return crypto.createHash('sha256').update(String(endpoint).trim()).digest('hex');
};

/**
 * Save or update a client push subscription
 */
export const saveSubscription = async ({ endpoint, keys, userAgent }) => {
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid push subscription payload');
  }

  const endpointHash = hashEndpoint(endpoint);

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpointHash },
    update: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
      isActive: true,
      updatedAt: new Date()
    },
    create: {
      endpoint,
      endpointHash,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
      isActive: true
    }
  });

  return subscription;
};

/**
 * Unsubscribe / Deactivate a client push subscription
 */
export const unsubscribe = async (endpoint) => {
  if (!endpoint) return null;
  const endpointHash = hashEndpoint(endpoint);

  return prisma.pushSubscription.updateMany({
    where: { endpointHash },
    data: { isActive: false }
  });
};

/**
 * Broadcast Push Notification to all active subscribers
 */
export const broadcastPushNotification = async ({
  title,
  body,
  icon = '/logo.png',
  image = null,
  url = '/',
  tag = 'news-alert'
}) => {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.warn('⚠️ VAPID keys not configured, skipping broadcast.');
    return { success: false, reason: 'VAPID keys missing' };
  }

  // Fetch all active subscribers
  const activeSubs = await prisma.pushSubscription.findMany({
    where: { isActive: true }
  });

  if (activeSubs.length === 0) {
    console.log('[WebPush] No active push subscribers registered yet.');
    return { total: 0, sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title: title || 'ताज़ा ख़बर',
    body: body || 'ख़बर विस्तार से पढ़ने के लिए क्लिक करें',
    icon: icon || '/android-chrome-192x192.png',
    image: image || null,
    badge: '/icon.png',
    data: {
      url: url || '/'
    },
    tag: tag || `news-${Date.now()}`
  });

  let sent = 0;
  let failed = 0;
  const expiredIds = [];

  // Dispatch concurrently in batches
  await Promise.allSettled(
    activeSubs.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, payload, {
          TTL: 86400, // Keep queued for 24 hours
          urgency: 'high'
        });
        sent++;
      } catch (err) {
        failed++;
        // If subscription is expired or unsubscribed on browser side (404/410)
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    try {
      await prisma.pushSubscription.updateMany({
        where: { id: { in: expiredIds } },
        data: { isActive: false }
      });
    } catch (cleanErr) {
      console.warn('[WebPush] Error cleaning expired subscriptions:', cleanErr.message);
    }
  }

  console.log(`[WebPush] Broadcast complete: ${sent} sent, ${failed} failed out of ${activeSubs.length} subscribers.`);
  return {
    total: activeSubs.length,
    sent,
    failed
  };
};

