import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';

function slugify(text) {
  if (!text) return 'news-' + Date.now();
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0900-\u097F\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const createArticle = async (data, user = null) => {
  const baseSlug = slugify(data.title);
  const uniqueSlug = `${baseSlug}-${Date.now()}`;

  const bulletPointsStr = Array.isArray(data.bulletPoints) 
    ? JSON.stringify(data.bulletPoints) 
    : (typeof data.bulletPoints === 'string' ? data.bulletPoints : null);

  const tagsStr = Array.isArray(data.tags) 
    ? data.tags.join(', ') 
    : (typeof data.tags === 'string' ? data.tags : null);

  // Security & Role-based status enforcement
  let finalStatus = data.status || 'PUBLISHED';
  let reporterId = null;
  let authorName = data.authorName || 'News Desk';
  let submittedAt = null;

  if (user && user.role === 'REPORTER') {
    // 1. Verify reporter is approved
    if (user.status !== 'APPROVED') {
      throw new AppError('Only approved reporters can submit or draft news articles. Your account is currently pending or suspended.', 403);
    }
    reporterId = user.id;
    authorName = user.name || 'Reporter Desk';
    
    // 2. Reporters can ONLY create DRAFT or submit for PENDING_REVIEW (Never PUBLISHED!)
    const requestedStatus = (data.status || 'PENDING_REVIEW').toUpperCase();
    if (requestedStatus === 'DRAFT') {
      finalStatus = 'DRAFT';
    } else {
      finalStatus = 'PENDING_REVIEW';
      submittedAt = new Date();
    }
  } else if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    finalStatus = data.status || 'PUBLISHED';
    reporterId = data.reporterId || null;
    authorName = data.authorName || user.name || 'News Desk';
  }

  const createPayload = {
    title: data.title,
    slug: uniqueSlug,
    subHeadline: data.subHeadline || null,
    content: data.content,
    category: (data.category || 'national').toLowerCase(),
    subCategory: data.subCategory || null,
    featuredImage: data.featuredImage || null,
    imageCaption: data.imageCaption || null,
    authorName,
    authorAvatar: data.authorAvatar || null,
    bulletPoints: bulletPointsStr,
    tags: tagsStr,
    isLeadStory: user?.role === 'REPORTER' ? false : Boolean(data.isLeadStory),
    isTrending: user?.role === 'REPORTER' ? false : Boolean(data.isTrending),
    isIndexed: typeof data.isIndexed !== 'undefined' ? Boolean(data.isIndexed) : true,
    status: finalStatus,
    reporterId,
    submittedAt,
    publishedAt: finalStatus === 'PUBLISHED' ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : new Date(),
    metaTitle: data.metaTitle ? String(data.metaTitle).trim() : null,
    metaDescription: data.metaDescription ? String(data.metaDescription).trim() : null,
    metaKeywords: data.metaKeywords ? String(data.metaKeywords).trim() : null,
    canonicalUrl: data.canonicalUrl ? String(data.canonicalUrl).trim() : null,
  };

  try {
    return await prisma.article.create({
      data: createPayload,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true
          }
        }
      }
    });
  } catch (err) {
    if (err.message && (err.message.includes("isIndexed") || err.message.includes("metaTitle") || err.message.includes("Unknown argument") || err.message.includes("Unknown column"))) {
      delete createPayload.metaTitle;
      delete createPayload.metaDescription;
      delete createPayload.metaKeywords;
      delete createPayload.canonicalUrl;
      delete createPayload.isIndexed;
      return await prisma.article.create({
        data: createPayload
      });
    }
    throw err;
  }
};

export const getArticles = async (query = {}, user = null) => {
  const {
    category,
    status,
    search,
    isLeadStory,
    isTrending,
    reporterId,
    reviewQueue,
    page = 1,
    limit = 10,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = query;

  const where = {
    deletedAt: null // Soft delete filter
  };

  // If user is a reporter querying their own list, strictly scope by reporterId
  if (user && user.role === 'REPORTER') {
    where.reporterId = user.id;
  } else if (reporterId) {
    where.reporterId = reporterId;
  }

  // Editorial Review Queue filter
  if (reviewQueue === 'true') {
    where.status = { in: ['PENDING_REVIEW', 'NEEDS_REVISION'] };
  } else if (status && status !== 'all') {
    where.status = status;
  }

  if (category && category !== 'all' && category !== 'latest' && category !== 'latest-news') {
    where.category = category.toLowerCase();
  }

  if (typeof isLeadStory !== 'undefined') {
    where.isLeadStory = isLeadStory === 'true' || isLeadStory === true;
  }

  if (typeof isTrending !== 'undefined') {
    where.isTrending = isTrending === 'true' || isTrending === true;
  }

  if (search && search.trim() !== '') {
    where.OR = [
      { title: { contains: search.trim() } },
      { content: { contains: search.trim() } },
      { subHeadline: { contains: search.trim() } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * take;

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            profileImage: true
          }
        }
      }
    })
  ]);

  return {
    articles,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};

export const getArticleByIdOrSlug = async (idOrSlug, user = null) => {
  const article = await prisma.article.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          profileImage: true,
          idProofUrl: true
        }
      }
    }
  });

  if (!article) return null;

  // Access rules:
  // If public (user is null or unauthenticated), only PUBLISHED articles can be read.
  if (!user && article.status !== 'PUBLISHED') {
    return null;
  }

  // If user is a reporter, they can only view if PUBLISHED or if it's their own submission
  if (user && user.role === 'REPORTER') {
    if (article.status !== 'PUBLISHED' && article.reporterId !== user.id) {
      throw new AppError('Access denied: You can only view your own drafts or review submissions', 403);
    }
  }

  // Increment view count if published
  if (article.status === 'PUBLISHED') {
    prisma.article.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});
  }

  return article;
};

export const updateArticle = async (id, data, user = null) => {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null }
  });

  if (!article) {
    throw new AppError('Article not found', 404);
  }

  // Strict ownership check for reporters
  if (user && user.role === 'REPORTER') {
    if (user.status !== 'APPROVED') {
      throw new AppError('Only approved reporters can modify articles', 403);
    }
    if (article.reporterId !== user.id) {
      throw new AppError('Access denied: You do not have permission to modify this article', 403);
    }
    // Published articles cannot be modified directly by reporters
    if (article.status === 'PUBLISHED') {
      throw new AppError('Published articles cannot be edited directly. Please contact the editorial desk.', 403);
    }

    // Reporters can only transition between DRAFT and PENDING_REVIEW
    if (data.status) {
      const s = data.status.toUpperCase();
      if (s === 'PENDING_REVIEW' || s === 'SUBMIT') {
        data.status = 'PENDING_REVIEW';
        data.submittedAt = new Date();
      } else {
        data.status = 'DRAFT';
      }
    }
    // Prevent reporter from changing lead/trending/reporterId
    delete data.isLeadStory;
    delete data.isTrending;
    delete data.reporterId;
  }

  const updateData = { ...data };
  if (updateData.slug) {
    updateData.slug = slugify(updateData.slug);
  }

  if (Array.isArray(updateData.bulletPoints)) {
    updateData.bulletPoints = JSON.stringify(updateData.bulletPoints);
  }
  if (Array.isArray(updateData.tags)) {
    updateData.tags = updateData.tags.join(', ');
  }
  if (updateData.category) {
    updateData.category = updateData.category.toLowerCase();
  }
  if (typeof updateData.isLeadStory !== 'undefined') {
    updateData.isLeadStory = Boolean(updateData.isLeadStory);
  }
  if (typeof updateData.isTrending !== 'undefined') {
    updateData.isTrending = Boolean(updateData.isTrending);
  }
  if (typeof updateData.isIndexed !== 'undefined') {
    updateData.isIndexed = Boolean(updateData.isIndexed);
  }

  // Sanitize SEO fields
  if (typeof updateData.metaTitle !== 'undefined') {
    updateData.metaTitle = updateData.metaTitle ? String(updateData.metaTitle).trim() : null;
  }
  if (typeof updateData.metaDescription !== 'undefined') {
    updateData.metaDescription = updateData.metaDescription ? String(updateData.metaDescription).trim() : null;
  }
  if (typeof updateData.metaKeywords !== 'undefined') {
    updateData.metaKeywords = updateData.metaKeywords ? String(updateData.metaKeywords).trim() : null;
  }
  if (typeof updateData.canonicalUrl !== 'undefined') {
    updateData.canonicalUrl = updateData.canonicalUrl ? String(updateData.canonicalUrl).trim() : null;
  }

  // Strict whitelist of recognized Article schema fields
  const allowedFields = [
    'title', 'slug', 'subHeadline', 'content', 'category', 'subCategory',
    'featuredImage', 'imageCaption', 'authorName', 'authorAvatar',
    'bulletPoints', 'tags', 'isLeadStory', 'isTrending', 'status',
    'viewsCount', 'likesCount', 'readTimeMinutes', 'publishedAt',
    'metaTitle', 'metaDescription', 'metaKeywords', 'canonicalUrl', 'isIndexed',
    'reporterId', 'adminFeedback', 'submittedAt', 'reviewedAt', 'reviewedBy'
  ];

  const sanitizedData = {};
  for (const field of allowedFields) {
    if (typeof updateData[field] !== 'undefined') {
      sanitizedData[field] = updateData[field];
    }
  }

  try {
    return await prisma.article.update({
      where: { id },
      data: sanitizedData,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true
          }
        }
      }
    });
  } catch (err) {
    if (err.message && (err.message.includes("isIndexed") || err.message.includes("metaTitle") || err.message.includes("Unknown argument") || err.message.includes("Unknown column"))) {
      const fallbackData = { ...sanitizedData };
      delete fallbackData.metaTitle;
      delete fallbackData.metaDescription;
      delete fallbackData.metaKeywords;
      delete fallbackData.canonicalUrl;
      delete fallbackData.isIndexed;
      return await prisma.article.update({
        where: { id },
        data: fallbackData
      });
    }
    throw err;
  }
};

/**
 * Editorial Review Action (Admin Only)
 * Action: 'PUBLISH' | 'APPROVE' | 'REQUEST_REVISION' | 'REJECT' | 'UNPUBLISH'
 */
export const reviewArticle = async (id, reviewData, adminUser) => {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null }
  });

  if (!article) {
    throw new AppError('Article not found', 404);
  }

  const { action, feedback, category, isLeadStory, isTrending } = reviewData;
  const upperAction = (action || '').toUpperCase();

  const updatePayload = {
    reviewedAt: new Date(),
    reviewedBy: adminUser?.name || 'Administrator'
  };

  if (category) {
    updatePayload.category = category.toLowerCase().trim();
  }
  if (typeof isLeadStory !== 'undefined') {
    updatePayload.isLeadStory = Boolean(isLeadStory);
  }
  if (typeof isTrending !== 'undefined') {
    updatePayload.isTrending = Boolean(isTrending);
  }

  switch (upperAction) {
    case 'PUBLISH':
      updatePayload.status = 'PUBLISHED';
      updatePayload.publishedAt = new Date();
      updatePayload.adminFeedback = null;
      break;

    case 'APPROVE':
      updatePayload.status = 'APPROVED';
      updatePayload.adminFeedback = null;
      break;

    case 'REQUEST_REVISION':
      if (!feedback || !feedback.trim()) {
        throw new AppError('Feedback note is required when requesting revision from the reporter.', 400);
      }
      updatePayload.status = 'NEEDS_REVISION';
      updatePayload.adminFeedback = feedback.trim();
      break;

    case 'REJECT':
      updatePayload.status = 'REJECTED';
      updatePayload.adminFeedback = feedback ? feedback.trim() : 'Does not meet editorial guidelines.';
      break;

    case 'UNPUBLISH':
      updatePayload.status = 'UNPUBLISHED';
      break;

    default:
      throw new AppError(`Invalid review action. Must be PUBLISH, APPROVE, REQUEST_REVISION, REJECT, or UNPUBLISH.`, 400);
  }

  const updated = await prisma.article.update({
    where: { id },
    data: updatePayload,
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  return updated;
};

/**
 * Get Editorial Review Queue (Admin Only)
 */
export const getReviewQueue = async (query = {}) => {
  const { page = 1, limit = 20, status = 'PENDING_REVIEW' } = query;

  const where = {
    deletedAt: null,
    status: status === 'ALL'
      ? { in: ['PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED'] }
      : status
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const [total, articles, pendingCount, revisionCount] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip,
      take,
      orderBy: { submittedAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            profileImage: true,
            idProofUrl: true
          }
        }
      }
    }),
    prisma.article.count({ where: { deletedAt: null, status: 'PENDING_REVIEW' } }),
    prisma.article.count({ where: { deletedAt: null, status: 'NEEDS_REVISION' } })
  ]);

  return {
    articles,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take)
    },
    counts: {
      pendingReview: pendingCount,
      needsRevision: revisionCount
    }
  };
};

export const deleteArticle = async (id, user = null) => {
  const article = await prisma.article.findFirst({
    where: { id, deletedAt: null }
  });

  if (!article) {
    throw new AppError('Article not found', 404);
  }

  if (user && user.role === 'REPORTER') {
    if (article.reporterId !== user.id) {
      throw new AppError('Access denied: You can only delete your own draft articles', 403);
    }
    if (article.status === 'PUBLISHED') {
      throw new AppError('Published articles cannot be deleted by reporters.', 403);
    }
  }

  // Soft Delete: update deletedAt timestamp
  return await prisma.article.update({
    where: { id },
    data: {
      deletedAt: new Date()
    }
  });
};

export const getHomeArticles = async () => {
  const baseWhere = {
    deletedAt: null,
    status: 'PUBLISHED'
  };

  let leadStory = await prisma.article.findFirst({
    where: { ...baseWhere, isLeadStory: true },
    orderBy: { publishedAt: 'desc' }
  });

  if (!leadStory) {
    leadStory = await prisma.article.findFirst({
      where: baseWhere,
      orderBy: { publishedAt: 'desc' }
    });
  }

  const excludeId = leadStory?.id ? [leadStory.id] : [];

  const subLeads = await prisma.article.findMany({
    where: {
      ...baseWhere,
      id: { notIn: excludeId }
    },
    take: 4,
    orderBy: { publishedAt: 'desc' }
  });

  // 1. Fetch Top News (Trending)
  const trending = await prisma.article.findMany({
    where: {
      ...baseWhere,
      isTrending: true
    },
    take: 5,
    orderBy: { publishedAt: 'desc' }
  });

  let trendingList = trending;
  if (trendingList.length < 5) {
    const trendingIds = trendingList.map(t => t.id);
    const extra = await prisma.article.findMany({
      where: {
        ...baseWhere,
        id: { notIn: trendingIds }
      },
      take: 5 - trendingList.length,
      orderBy: { viewsCount: 'desc' }
    });
    trendingList = [...trendingList, ...extra];
  }

  // 2. Fetch Quick Highlights: MUST NOT be in Top News (Zero Duplicates Guarantee)
  const topNewsIds = trendingList.map(t => t.id);
  const excludedFromHighlights = [
    ...excludeId,
    ...subLeads.map(s => s.id),
    ...topNewsIds
  ];

  let quickHighlights = await prisma.article.findMany({
      where: {
        ...baseWhere,
        tags: { contains: 'quick_highlight' }
      },
      take: 5,
      orderBy: { publishedAt: 'desc' }
    });

    if (quickHighlights.length < 5) {
      const existingHighlightIds = quickHighlights.map(q => q.id);
      const extra = await prisma.article.findMany({
        where: {
          ...baseWhere,
          id: { notIn: [...excludedFromHighlights, ...existingHighlightIds] }
        },
        take: 5 - quickHighlights.length,
        orderBy: [
          { viewsCount: 'desc' },
          { publishedAt: 'desc' }
        ]
      });
      quickHighlights = [...quickHighlights, ...extra];
    }

  const categoryKeys = ['entertainment', 'world', 'explainer', 'lifestyle', 'auto', 'tech', 'education', 'business', 'fashion', 'cricket', 'sports', 'national', 'india'];
  const categories = {};

  await Promise.all(categoryKeys.map(async (cat) => {
    categories[cat] = await prisma.article.findMany({
      where: {
        ...baseWhere,
        category: cat
      },
      take: 4,
      orderBy: { publishedAt: 'desc' }
    });
  }));

  return {
    leadStory,
    subLeads,
    quickHighlights,
    trending: trendingList,
    categories
  };
};
