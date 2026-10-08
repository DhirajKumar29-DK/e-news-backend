import { prisma } from '../../config/db.js';

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

export const createArticle = async (data) => {
  let baseSlug = slugify(data.title || data.slug || 'article');
  if (!baseSlug) baseSlug = 'article-' + Date.now();
  
  // Ensure unique slug
  let uniqueSlug = baseSlug;
  const existing = await prisma.article.findUnique({
    where: { slug: uniqueSlug }
  });
  if (existing) {
    uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const bulletPointsStr = Array.isArray(data.bulletPoints) 
    ? JSON.stringify(data.bulletPoints) 
    : (typeof data.bulletPoints === 'string' ? data.bulletPoints : null);

  const tagsStr = Array.isArray(data.tags) 
    ? data.tags.join(', ') 
    : (typeof data.tags === 'string' ? data.tags : null);

  return await prisma.article.create({
    data: {
      title: data.title,
      slug: uniqueSlug,
      subHeadline: data.subHeadline || null,
      content: data.content,
      category: (data.category || 'national').toLowerCase(),
      subCategory: data.subCategory || null,
      featuredImage: data.featuredImage || null,
      imageCaption: data.imageCaption || null,
      authorName: data.authorName || 'News Desk',
      authorAvatar: data.authorAvatar || null,
      bulletPoints: bulletPointsStr,
      tags: tagsStr,
      isLeadStory: Boolean(data.isLeadStory),
      isTrending: Boolean(data.isTrending),
      status: data.status || 'PUBLISHED',
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
    }
  });
};

export const getArticles = async (query = {}) => {
  const {
    category,
    status,
    search,
    isLeadStory,
    isTrending,
    page = 1,
    limit = 10,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = query;

  const where = {
    deletedAt: null // Soft delete filter
  };

  if (category && category !== 'all' && category !== 'latest' && category !== 'latest-news') {
    where.category = category.toLowerCase();
  }

  if (status && status !== 'all') {
    where.status = status;
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

export const getArticleByIdOrSlug = async (idOrSlug) => {
  const article = await prisma.article.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  });

  if (article) {
    prisma.article.update({
      where: { id: article.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});
  }

  return article;
};

export const updateArticle = async (id, data) => {
  const updateData = { ...data };

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

  return await prisma.article.update({
    where: { id },
    data: updateData
  });
};

export const deleteArticle = async (id) => {
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

  const quickHighlights = await prisma.article.findMany({
    where: {
      ...baseWhere,
      id: { notIn: excludedFromHighlights }
    },
    take: 5,
    orderBy: [
      { viewsCount: 'desc' },
      { publishedAt: 'desc' }
    ]
  });

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
