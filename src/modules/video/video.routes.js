import { Router } from 'express';
import * as videoController from './video.controller.js';
import { uploadVideoFile, uploadArticleImage } from '../../middleware/upload.middleware.js';

const router = Router();

// 1. Direct Video File Upload (MP4, WebM, MOV)
router.post('/upload', uploadVideoFile.single('video'), videoController.uploadVideoFile);

// 2. Custom Thumbnail Image Upload
router.post('/upload-thumbnail', uploadArticleImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No thumbnail file uploaded' });
  }
  const imageUrl = `/uploads/articles/${req.file.filename}`;
  res.status(201).json({ success: true, message: 'Thumbnail uploaded', data: { imageUrl } });
});

// 3. Showcase Feed (Featured Hero + Top 5 Trending + Recents)
router.get('/featured-trending', videoController.getFeaturedAndTrending);

// 4. Paginated Video List
router.get('/', videoController.getVideos);

// 5. Single Video by ID or Slug
router.get('/:idOrSlug', videoController.getVideoByIdOrSlug);

// 6. Create Video (Admin)
router.post('/', videoController.createVideo);

// 7. Update Video (Admin)
router.put('/:id', videoController.updateVideo);

// 8. Soft Delete Video (Admin)
router.delete('/:id', videoController.deleteVideo);

// 9. Increment Views Counter
router.post('/:id/view', videoController.incrementViews);

export default router;
