import { Router } from 'express';
import { adController } from './ad.controller.js';
import { uploadAdImage } from '../../middleware/upload.middleware.js';

const router = Router();

// 1. Image File Upload Endpoint for Ads
router.post('/upload', uploadAdImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/ads/${req.file.filename}`;
  res.status(201).json({ success: true, message: 'Ad image uploaded', data: { imageUrl } });
});

// 2. Public: Get active ad for a slot (e.g., /api/v1/ads/public?slot=HOMEPAGE_TOP)
router.get('/public', adController.getPublicAd);

// 3. Public: Record click beacon
router.post('/:id/click', adController.recordClick);

// 4. Admin: List all ads with filters
router.get('/', adController.getAllAds);

// 5. Admin: Single ad by ID
router.get('/:id', adController.getAdById);

// 6. Admin: Create new ad
router.post('/', uploadAdImage.single('image'), adController.createAd);

// 7. Admin: Update ad
router.put('/:id', uploadAdImage.single('image'), adController.updateAd);

// 8. Admin: Delete ad
router.delete('/:id', adController.deleteAd);

export default router;
