import { Router } from 'express';
import * as articleController from './article.controller.js';
import { uploadArticleImage } from '../../middleware/upload.middleware.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// 1. Image File Upload Endpoint (Multer)
router.post('/upload', uploadArticleImage.single('image'), articleController.uploadImage);

// 2. Specially aggregated homepage feed (Hero, Sub-leads, Trending, Category blocks)
router.get('/home', articleController.getHomeArticles);

// 3. Editorial Review Queue (Admin Only) - Must precede /:idOrSlug
router.get('/review/queue', authMiddleware(['ADMIN', 'SUPER_ADMIN']), articleController.getReviewQueue);

// 4. Admin Editorial Review Action (Publish, Request Revision, Reject, Unpublish)
router.put('/:id/review', authMiddleware(['ADMIN', 'SUPER_ADMIN']), articleController.reviewArticle);

// 5. Paginated article list with category & search filter (Supports reporterId & optional auth)
router.get('/', optionalAuthMiddleware(), articleController.getArticles);

// 6. Single article by ID or unique Slug (Optional auth allows previewing own drafts)
router.get('/:idOrSlug', optionalAuthMiddleware(), articleController.getArticleByIdOrSlug);

// 7. Create new article (Admin or Approved Reporter)
router.post('/', authMiddleware(['ADMIN', 'SUPER_ADMIN', 'REPORTER']), articleController.createArticle);

// 8. Update article (Admin or Author Reporter)
router.put('/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN', 'REPORTER']), articleController.updateArticle);

// 9. Soft Delete article (Admin or Author Reporter)
router.delete('/:id', authMiddleware(['ADMIN', 'SUPER_ADMIN', 'REPORTER']), articleController.deleteArticle);

export default router;
