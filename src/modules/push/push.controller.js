import * as pushService from './push.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/db.js';

export const getPublicKey = (req, res) => {
  return sendSuccess(res, 'Public key retrieved', {
    publicKey: env.VAPID_PUBLIC_KEY
  });
};

export const subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return sendError(res, 'Valid subscription object is required', null, 400);
    }

    const userAgent = req.headers['user-agent'] || null;
    const result = await pushService.saveSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent
    });

    return sendSuccess(res, 'Subscribed to push notifications successfully', { id: result.id }, 201);
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return sendError(res, 'Endpoint is required', null, 400);
    }

    await pushService.unsubscribe(endpoint);
    return sendSuccess(res, 'Unsubscribed successfully');
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const totalSubscribers = await prisma.pushSubscription.count({
      where: { isActive: true }
    });
    return sendSuccess(res, 'Push stats retrieved', { totalSubscribers });
  } catch (error) {
    next(error);
  }
};

export const sendTestNotification = async (req, res, next) => {
  try {
    const { title, body, url, image } = req.body;
    const result = await pushService.broadcastPushNotification({
      title: title || 'परीक्षण सूचना (Test Alert)',
      body: body || 'यह वेबसाइट की ओर से एक टेस्ट पुश नोटिफिकेशन है।',
      url: url || '/',
      image: image || null
    });

    return sendSuccess(res, 'Test notification dispatched', result);
  } catch (error) {
    next(error);
  }
};

