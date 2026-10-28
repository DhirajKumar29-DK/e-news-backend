import { prisma } from '../../config/db.js';

export const adService = {
  /**
   * Fetch single active ad for a slot (Public)
   * Validates date window (startDate <= now <= endDate)
   * Auto-increments viewsCount
   */
  async getPublicAdBySlot(slot) {
    if (!slot) return null;
    const now = new Date();

    const ad = await prisma.advertisement.findFirst({
      where: {
        slot: slot.toUpperCase(),
        isActive: true,
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
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
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
