import { Router } from 'express';
import * as pushController from './push.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes for readers
router.get('/public-key', pushController.getPublicKey);
router.post('/subscribe', pushController.subscribe);
router.post('/unsubscribe', pushController.unsubscribe);

// Admin routes for statistics and test dispatches
router.get('/stats', authMiddleware(['ADMIN', 'SUPER_ADMIN']), pushController.getStats);
router.post('/test', authMiddleware(['ADMIN', 'SUPER_ADMIN']), pushController.sendTestNotification);

export default router;
