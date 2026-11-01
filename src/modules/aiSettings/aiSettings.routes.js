/**
 * AI Settings Routes
 * Protected with Admin authorization middleware.
 * Returns 401 for unauthenticated requests and 403 for non-admin users.
 */

import { Router } from 'express';
import * as aiSettingsController from './aiSettings.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Strict Admin authorization on all AI Settings endpoints
router.use(authMiddleware(['ADMIN']));

router.get('/', aiSettingsController.getSettings);
router.get('/usage', aiSettingsController.getUsageStats);
router.put('/', aiSettingsController.updateSettings);
router.post('/models', aiSettingsController.fetchModels);
router.post('/test-connection', aiSettingsController.testConnection);
router.post('/reveal-key', aiSettingsController.revealKey);

export default router;
