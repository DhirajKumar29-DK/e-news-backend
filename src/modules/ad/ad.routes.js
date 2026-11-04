import { Router } from 'express';
import { adController } from './ad.controller.js';
import { uploadAdCreative, uploadAdImage } from '../../middleware/upload.middleware.js';

const router = Router();

// 1. Image/Creative File Upload Endpoint
router.post('/upload', uploadAdCreative.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image or video file uploaded' });
  }
  const imageUrl = `/uploads/ads/${req.file.filename}`;
  res.status(201).json({ success: true, message: 'Ad creative uploaded', data: { imageUrl } });
});

// 2. Public: Submit Self-Serve Ad Order (from /advertise page)
router.post('/self-serve', uploadAdCreative.single('creative'), adController.createSelfServeAd);

// 3. Admin: List Self-Serve Ad Orders
router.get('/self-serve/orders', adController.getSelfServeOrders);

// 4. Admin: Verify Payment & Publish Live + Email Advertiser
router.patch('/:id/verify-publish', adController.verifyAndPublishAd);

// 5. Admin: Reject Ad + Email Advertiser
router.patch('/:id/reject', adController.rejectAd);

// 6. Public: Check real-time slot availability
router.get('/slots/availability', adController.getSlotAvailability);

// 7. Public: Get active ad for a slot
router.get('/public', adController.getPublicAd);

// 7. Public: Record click beacon
router.post('/:id/click', adController.recordClick);

// 8. Admin: List all ads with filters
router.get('/', adController.getAllAds);

// 9. Admin: Single ad by ID
router.get('/:id', adController.getAdById);

// 10. Admin: Create new ad
router.post('/', uploadAdImage.single('image'), adController.createAd);

// 11. Admin: Update ad
router.put('/:id', uploadAdImage.single('image'), adController.updateAd);

// 12. Admin: Delete ad
router.delete('/:id', adController.deleteAd);

export default router;
