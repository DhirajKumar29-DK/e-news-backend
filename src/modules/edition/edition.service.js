import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';

/**
 * Get all active editions (For Public Reader & Admin Navbar)
 */
export const getAllEditions = async (includeInactive = false) => {
  const whereCondition = { deletedAt: null };
  if (!includeInactive) {
    whereCondition.isActive = true;
  }

  return await prisma.edition.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get Edition by ID or Slug
 */
export const getEditionByIdOrSlug = async (identifier) => {
  const edition = await prisma.edition.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
      deletedAt: null
    }
  });

  if (!edition) {
    throw new AppError('Edition not found', 404);
  }

  return edition;
};

/**
 * Create New Edition (Admin Only)
 */
export const createEdition = async (data) => {
  const existingSlug = await prisma.edition.findUnique({
    where: { slug: data.slug }
  });

  if (existingSlug && existingSlug.deletedAt === null) {
    throw new AppError('An edition with this URL slug already exists', 400);
  }

  return await prisma.edition.create({ data });
};

/**
 * Update Edition (Admin Only)
 */
export const updateEdition = async (id, data) => {
  const edition = await prisma.edition.findFirst({
    where: { id, deletedAt: null }
  });

  if (!edition) {
    throw new AppError('Edition not found', 404);
  }

  if (data.slug && data.slug !== edition.slug) {
    const existingSlug = await prisma.edition.findUnique({
      where: { slug: data.slug }
    });
    if (existingSlug && existingSlug.id !== id && existingSlug.deletedAt === null) {
      throw new AppError('An edition with this URL slug already exists', 400);
    }
  }

  return await prisma.edition.update({
    where: { id },
    data
  });
};

/**
 * Soft Delete Edition (Admin Only)
 */
export const deleteEdition = async (id) => {
  const edition = await prisma.edition.findFirst({
    where: { id, deletedAt: null }
  });

  if (!edition) {
    throw new AppError('Edition not found or already deleted', 404);
  }

  await prisma.edition.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false }
  });

  return { message: 'Edition deleted successfully (Soft Delete)' };
};
