import { Router } from 'express';
import * as reporterController from './reporter.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Strict Admin-only middleware: only ADMIN / SUPER_ADMIN can manage reporters
const requireAdmin = authMiddleware(['ADMIN', 'SUPER_ADMIN']);

// 1. Get paginated list of reporters with search & status filters
router.get('/', requireAdmin, reporterController.getReporters);

// 2. Get single reporter details and submission history
router.get('/:id', requireAdmin, reporterController.getReporter);

// 3. Admin creates reporter directly
router.post('/', requireAdmin, reporterController.createReporter);

// 4. Admin updates reporter status (APPROVE, REJECT, SUSPEND, ACTIVE)
router.put('/:id/status', requireAdmin, reporterController.updateStatus);

// 5. Admin soft-deletes reporter (preserves historical published articles)
router.delete('/:id', requireAdmin, reporterController.deleteReporter);

export default router;

