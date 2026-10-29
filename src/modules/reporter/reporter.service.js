import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import * as emailService from '../../services/email.service.js';

/**
 * Get Paginated List of Reporters with KPI Summary
 */
export const getAllReporters = async (query = {}) => {
  const {
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const where = {
    role: 'REPORTER',
    deletedAt: null
  };

  if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { city: { contains: q } },
      { district: { contains: q } },
      { state: { contains: q } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const [total, reporters, kpiPending, kpiApproved, kpiSuspended, kpiRejected] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        city: true,
        district: true,
        state: true,
        bio: true,
        profileImage: true,
        idProofUrl: true,
        idProofType: true,
        idProofNumber: true,
        rejectionReason: true,
        preferredCategories: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { articles: true }
        }
      }
    }),
    prisma.user.count({ where: { role: 'REPORTER', status: 'PENDING', deletedAt: null } }),
    prisma.user.count({ where: { role: 'REPORTER', status: 'APPROVED', deletedAt: null } }),
    prisma.user.count({ where: { role: 'REPORTER', status: 'SUSPENDED', deletedAt: null } }),
    prisma.user.count({ where: { role: 'REPORTER', status: 'REJECTED', deletedAt: null } })
  ]);

  return {
    reporters,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take)
    },
    kpi: {
      totalReporters: kpiPending + kpiApproved + kpiSuspended + kpiRejected,
      pending: kpiPending,
      approved: kpiApproved,
      suspended: kpiSuspended,
      rejected: kpiRejected
    }
  };
};

/**
 * Get Reporter Profile by ID with their articles summary
 */
export const getReporterById = async (id) => {
  const reporter = await prisma.user.findFirst({
    where: {
      id,
      role: 'REPORTER',
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      city: true,
      district: true,
      state: true,
      bio: true,
      profileImage: true,
      idProofUrl: true,
      idProofType: true,
      idProofNumber: true,
      rejectionReason: true,
      preferredCategories: true,
      createdAt: true,
      updatedAt: true,
      articles: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          category: true,
          publishedAt: true,
          createdAt: true,
          viewsCount: true
        }
      },
      _count: {
        select: { articles: true }
      }
    }
  });

  if (!reporter) {
    throw new AppError('Reporter not found', 404);
  }

  return reporter;
};

/**
 * Admin Creates Reporter Account Directly
 */
export const createReporterByAdmin = async (data) => {
  const cleanEmail = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password || 'Reporter@123456', 10);

  const reporter = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: data.phone ? data.phone.trim() : null,
      role: 'REPORTER',
      status: data.status && ['PENDING', 'APPROVED'].includes(data.status.toUpperCase())
        ? data.status.toUpperCase()
        : 'APPROVED',
      city: data.city ? data.city.trim() : null,
      district: data.district ? data.district.trim() : null,
      state: data.state ? data.state.trim() : null,
      bio: data.bio ? data.bio.trim() : null,
      idProofUrl: data.idProofUrl || null,
      idProofType: data.idProofType || 'PRESS_ID',
      idProofNumber: data.idProofNumber ? data.idProofNumber.trim() : null,
      preferredCategories: data.preferredCategories || null
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true
    }
  });

  return reporter;
};

/**
 * Update Reporter Status (Approve, Reject, Suspend, Reactivate)
 */
export const updateReporterStatus = async (id, status, rejectionReason = null) => {
  const reporter = await prisma.user.findFirst({
    where: { id, role: 'REPORTER', deletedAt: null }
  });

  if (!reporter) {
    throw new AppError('Reporter not found', 404);
  }

  const upperStatus = status.toUpperCase();
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
  if (!validStatuses.includes(upperStatus)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: upperStatus,
      rejectionReason: upperStatus === 'REJECTED' ? (rejectionReason || null) : null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      rejectionReason: true,
      updatedAt: true
    }
  });

  // Trigger Email Notification upon Approval or Rejection
  if (upperStatus === 'APPROVED') {
    emailService.sendReporterApprovalEmail(updated).catch(err => {
      console.error('[EMAIL DISPATCH ERROR]', err);
    });
  } else if (upperStatus === 'REJECTED') {
    emailService.sendReporterRejectionEmail(updated, rejectionReason).catch(err => {
      console.error('[EMAIL DISPATCH ERROR]', err);
    });
  }

  return updated;
};

/**
 * Safe Delete Reporter Account
 * Soft-deletes user while preserving all past published news articles
 */
export const deleteReporter = async (id) => {
  const reporter = await prisma.user.findFirst({
    where: { id, role: 'REPORTER', deletedAt: null }
  });

  if (!reporter) {
    throw new AppError('Reporter not found', 404);
  }

  // Soft delete reporter
  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'SUSPENDED' // Lock status
    }
  });

  return { message: 'Reporter account safely deleted. Published articles have been preserved.' };
};

