import { prisma } from '../../config/db.js';
import { sendAdApprovalEmail, sendAdRejectionEmail } from '../../services/email.service.js';

export const adService = {
  /**
   * Fetch single active ad for a slot (Public)
   * Validates date window (startDate <= now <= endDate)
   * Only serves approved/active ads (never pending verification)
   * Auto-increments viewsCount
   */
  async getPublicAdBySlot(slot) {
    if (!slot) return null;
    const now = new Date();

    const ad = await prisma.advertisement.findFirst({
      where: {
        slot: slot.toUpperCase(),
        isActive: true,
        approvalStatus: { in: ['ACTIVE', 'APPROVED'] },
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (ad) {
      // Async increment view count without blocking response
      prisma.advertisement.update({
        where: { id: ad.id },
        data: { viewsCount: { increment: 1 } }
      }).catch(err => console.error('[AdService] Failed to increment view count:', err.message));
    }

    return ad;
  },

  /**
   * Record click beacon (Public)
   */
  async recordClick(id) {
    if (!id) return null;
    try {
      return await prisma.advertisement.update({
        where: { id },
        data: { clicksCount: { increment: 1 } }
      });
    } catch {
      return null;
    }
  },

  /**
   * Public: Check real-time slot availability for booking
   * Returns occupied slots with their end date
   */
  async getSlotAvailability() {
    const now = new Date();
    const activeAds = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        approvalStatus: { in: ['ACTIVE', 'APPROVED'] },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      select: {
        id: true,
        slot: true,
        title: true,
        startDate: true,
        endDate: true
      },
      orderBy: {
        endDate: 'desc'
      }
    });

    const availability = {};
    for (const ad of activeAds) {
      if (!ad.slot) continue;
      const slotKey = ad.slot.toUpperCase();
      if (!availability[slotKey] || (ad.endDate && new Date(ad.endDate) > new Date(availability[slotKey].endDate || 0))) {
        availability[slotKey] = {
          isOccupied: true,
          adId: ad.id,
          endDate: ad.endDate,
          startDate: ad.startDate
        };
      }
    }

    return availability;
  },

  /**
   * Public: Create Self-Serve Ad Order (from /advertise page)
   * Starts in PENDING_VERIFICATION status, isActive: false
   */
  async createSelfServeAd(data) {
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    // Default 30 days active window
    const endDate = data.endDate ? new Date(data.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return prisma.advertisement.create({
      data: {
        title: data.title,
        description: data.description || null,
        slot: (data.slot || 'HOMEPAGE_TOP').toUpperCase(),
        type: (data.type || 'IMAGE').toUpperCase(),
        imageUrl: data.imageUrl || null,
        targetUrl: data.targetUrl || null,
        targetDistrict: data.targetDistrict || 'ALL',
        actionType: (data.actionType || 'WEBSITE').toUpperCase(),
        allowCall: data.allowCall === true || data.allowCall === 'true',
        advertiserName: data.advertiserName || null,
        advertiserPhone: data.advertiserPhone || null,
        advertiserEmail: data.advertiserEmail || null,
        amountPaid: Number(data.amountPaid || 599),
        paymentMethod: data.paymentMethod || 'UPI',
        paymentRefNumber: data.paymentRefNumber || null,
        paymentProofUrl: data.paymentProofUrl || null,
        leadFormConfig: data.leadFormConfig ? (typeof data.leadFormConfig === 'string' ? data.leadFormConfig : JSON.stringify(data.leadFormConfig)) : null,
        approvalStatus: 'PENDING_VERIFICATION',
        isActive: false,
        isSelfServe: true,
        startDate,
        endDate
      }
    });
  },

  /**
   * Admin: List Self-Serve Ad Orders with filters
   */
  async getSelfServeOrders({ page = 1, limit = 50, status, search } = {}) {
    const where = { isSelfServe: true };
    if (status && status !== 'ALL') {
      where.approvalStatus = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { advertiserName: { contains: search } },
        { advertiserPhone: { contains: search } },
        { paymentRefNumber: { contains: search } }
      ];
    }

    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.advertisement.count({ where }),
      prisma.advertisement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      })
    ]);

    return {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  /**
   * Admin: Verify Payment and Publish Ad Live
   * Changes status to APPROVED, sets isActive = true, sends confirmation email
   */
  async verifyAndPublishAd(id) {
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new Error('Advertisement not found');

    const updated = await prisma.advertisement.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        isActive: true,
        rejectionReason: null
      }
    });

    // Send confirmation email asynchronously
    sendAdApprovalEmail(updated).catch(err => {
      console.error('[AdService] Failed to send approval email:', err.message);
    });

    return updated;
  },

  /**
   * Admin: Reject Ad
   * Sets status to REJECTED, isActive = false, sends rejection email
   */
  async rejectAd(id, reason) {
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new Error('Advertisement not found');

    const updated = await prisma.advertisement.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        isActive: false,
        rejectionReason: reason || 'Details or payment could not be verified.'
      }
    });

    // Send rejection email asynchronously
    sendAdRejectionEmail(updated, reason).catch(err => {
      console.error('[AdService] Failed to send rejection email:', err.message);
    });

    return updated;
  },

  /**
   * Admin: List all ads with optional filters
   */
  async getAllAds({ slot, isActive, page = 1, limit = 50 } = {}) {
    const where = {};
    if (slot) where.slot = slot.toUpperCase();
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const skip = (page - 1) * limit;

    const [total, ads] = await Promise.all([
      prisma.advertisement.count({ where }),
      prisma.advertisement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      })
    ]);

    return {
      ads,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  /**
   * Admin: Get single ad by ID
   */
  async getAdById(id) {
    return prisma.advertisement.findUnique({
      where: { id }
    });
  },

  /**
   * Admin: Create new ad
   */
  async createAd(data) {
    return prisma.advertisement.create({
      data: {
        title: data.title,
        slot: (data.slot || 'HOMEPAGE_TOP').toUpperCase(),
        type: (data.type || 'IMAGE').toUpperCase(),
        imageUrl: data.imageUrl || null,
        targetUrl: data.targetUrl || null,
        scriptCode: data.scriptCode || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        approvalStatus: 'ACTIVE'
      }
    });
  },

  /**
   * Admin: Update ad
   */
  async updateAd(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slot !== undefined) updateData.slot = data.slot.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type.toUpperCase();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
    if (data.scriptCode !== undefined) updateData.scriptCode = data.scriptCode;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.approvalStatus !== undefined) updateData.approvalStatus = data.approvalStatus;

    return prisma.advertisement.update({
      where: { id },
      data: updateData
    });
  },

  /**
   * Admin: Delete ad
   */
  async deleteAd(id) {
    return prisma.advertisement.delete({
      where: { id }
    });
  }
};
