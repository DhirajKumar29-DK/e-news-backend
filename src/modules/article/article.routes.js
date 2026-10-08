import { Router } from 'express';
import * as articleController from './article.controller.js';
import { uploadArticleImage } from '../../middleware/upload.middleware.js';

const router = Router();

// 1. Image File Upload Endpoint (Multer)
router.post('/upload', uploadArticleImage.single('image'), articleController.uploadImage);

// 2. Specially aggregated homepage feed (Hero, Sub-leads, Trending, Category blocks)
router.get('/home', articleController.getHomeArticles);

// 3. Paginated article list with category & search filter
router.get('/', articleController.getArticles);

// 4. Single article by ID or unique Slug
router.get('/:idOrSlug', articleController.getArticleByIdOrSlug);

// 5. Create new article (Admin)
router.post('/', articleController.createArticle);

// 6. Update article (Admin)
router.put('/:id', articleController.updateArticle);

// 7. Soft Delete article (Admin)
router.delete('/:id', articleController.deleteArticle);

export default router;
