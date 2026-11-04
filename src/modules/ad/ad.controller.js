import { adService } from './ad.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const adController = {
  /**
   * Public: Get active ad for a slot
   */
  async getPublicAd(req, res) {
    try {
      const { slot } = req.query;
      if (!slot) {
        return sendError(res, 'Slot parameter is required', null, 400);
      }
      const ad = await adService.getPublicAdBySlot(slot);
      return sendSuccess(res, 'Active ad fetched', ad);
    } catch (error) {
      console.error('[AdController:getPublicAd]', error);
      return sendError(res, 'Failed to fetch ad', error.message, 500);
    }
  },

  /**
   * Public: Check real-time slot availability for booking
   */
  async getSlotAvailability(req, res) {
    try {
      const data = await adService.getSlotAvailability();
      return sendSuccess(res, 'Slot availability fetched successfully', data);
    } catch (error) {
      console.error('[AdController:getSlotAvailability]', error);
      return sendError(res, 'Failed to fetch slot availability', error.message, 500);
    }
  },

  /**
   * Public: Record ad click beacon
   */
  async recordClick(req, res) {
    try {
      const { id } = req.params;
      const updated = await adService.recordClick(id);
      return sendSuccess(res, 'Click recorded', updated);
    } catch (error) {
      console.error('[AdController:recordClick]', error);
      return sendError(res, 'Failed to record click', error.message, 500);
    }
  },

  /**
   * Public: Create Self-Serve Ad Order (from /advertise page)
   */
  async createSelfServeAd(req, res) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.imageUrl = `/uploads/ads/${req.file.filename}`;
        const ext = req.file.filename.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'mov'].includes(ext)) {
          data.type = 'VIDEO';
        } else {
          data.type = 'IMAGE';
        }
      }

      if (!data.title) {
        return sendError(res, 'Ad title is required', null, 400);
      }
      if (!data.advertiserPhone) {
        return sendError(res, 'Phone number is required', null, 400);
      }
      if (!data.slot) {
        data.slot = 'HOMEPAGE_TOP';
      }

      const order = await adService.createSelfServeAd(data);
      return sendSuccess(res, 'Ad submitted successfully for verification', order, 201);
    } catch (error) {
      console.error('[AdController:createSelfServeAd]', error);
      return sendError(res, 'Failed to submit self-serve ad', error.message, 500);
    }
  },

  /**
   * Admin: List Self-Serve Ad Orders
   */
  async getSelfServeOrders(req, res) {
    try {
      const { page, limit, status, search } = req.query;
      const result = await adService.getSelfServeOrders({ page, limit, status, search });
      return sendSuccess(res, 'Self-serve orders fetched successfully', result);
    } catch (error) {
      console.error('[AdController:getSelfServeOrders]', error);
      return sendError(res, 'Failed to fetch self-serve orders', error.message, 500);
    }
  },

  /**
   * Admin: Verify Payment & Publish Ad Live
   */
  async verifyAndPublishAd(req, res) {
    try {
      const { id } = req.params;
      const updated = await adService.verifyAndPublishAd(id);
      return sendSuccess(res, 'Payment verified and ad published live successfully', updated);
    } catch (error) {
      console.error('[AdController:verifyAndPublishAd]', error);
      return sendError(res, 'Failed to verify and publish ad', error.message, 500);
    }
  },

  /**
   * Admin: Reject Ad
   */
  async rejectAd(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await adService.rejectAd(id, reason);
      return sendSuccess(res, 'Ad rejected and notice sent', updated);
    } catch (error) {
      console.error('[AdController:rejectAd]', error);
      return sendError(res, 'Failed to reject ad', error.message, 500);
    }
  },

  /**
   * Admin: List all ads
   */
  async getAllAds(req, res) {
    try {
      const { slot, isActive, page, limit } = req.query;
      const parsedIsActive = isActive === 'true' ? true : (isActive === 'false' ? false : undefined);
      const data = await adService.getAllAds({
        slot,
        isActive: parsedIsActive,
        page,
        limit
      });
      return sendSuccess(res, 'Ads retrieved successfully', data);
    } catch (error) {
      console.error('[AdController:getAllAds]', error);
      return sendError(res, 'Failed to fetch ads', error.message, 500);
    }
  },

  /**
   * Admin: Get single ad
   */
  async getAdById(id) {
    try {
      const ad = await adService.getAdById(id);
      if (!ad) {
        return sendError(res, 'Advertisement not found', null, 404);
      }
      return sendSuccess(res, 'Ad retrieved successfully', ad);
    } catch (error) {
      console.error('[AdController:getAdById]', error);
      return sendError(res, 'Failed to fetch ad', error.message, 500);
    }
  },

  /**
   * Admin: Create new ad
   */
  async createAd(req, res) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.imageUrl = `/uploads/ads/${req.file.filename}`;
      }
      if (!data.title) {
        return sendError(res, 'Ad title is required', null, 400);
      }
      if (!data.slot) {
        return sendError(res, 'Slot selection is required', null, 400);
      }

      const ad = await adService.createAd(data);
      return sendSuccess(res, 'Advertisement created successfully', ad, 201);
    } catch (error) {
      console.error('[AdController:createAd]', error);
      return sendError(res, 'Failed to create advertisement', error.message, 500);
    }
  },

  /**
   * Admin: Update ad
   */
  async updateAd(req, res) {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (req.file) {
        data.imageUrl = `/uploads/ads/${req.file.filename}`;
      }

      const existing = await adService.getAdById(id);
      if (!existing) {
        return sendError(res, 'Advertisement not found', null, 404);
      }

      const updated = await adService.updateAd(id, data);
      return sendSuccess(res, 'Advertisement updated successfully', updated);
    } catch (error) {
      console.error('[AdController:updateAd]', error);
      return sendError(res, 'Failed to update advertisement', error.message, 500);
    }
  },

  /**
   * Admin: Delete ad
   */
  async deleteAd(req, res) {
    try {
      const { id } = req.params;
      const existing = await adService.getAdById(id);
      if (!existing) {
        return sendError(res, 'Advertisement not found', null, 404);
      }

      await adService.deleteAd(id);
      return sendSuccess(res, 'Advertisement deleted successfully');
    } catch (error) {
      console.error('[AdController:deleteAd]', error);
      return sendError(res, 'Failed to delete advertisement', error.message, 500);
    }
  }
};
