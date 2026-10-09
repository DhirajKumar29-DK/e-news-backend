import { prisma } from '../../config/db.js';

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function slugify(text) {
  if (!text) return 'video-' + Date.now();
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

export const createVideo = async (data) => {
  let baseSlug = slugify(data.title || data.slug || 'video');
  if (!baseSlug) baseSlug = 'video-' + Date.now();

  let uniqueSlug = baseSlug;
  const existing = await prisma.video.findUnique({
    where: { slug: uniqueSlug }
  });
  if (existing) {
    uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const rawUrl = data.videoUrl || '';
  const detectedYtId = extractYouTubeId(rawUrl);
  const videoType = data.videoType || (detectedYtId ? 'URL' : (rawUrl.startsWith('http') ? 'URL' : 'UPLOAD'));

  let thumbnailUrl = data.thumbnailUrl || null;
  if (!thumbnailUrl && detectedYtId) {
    thumbnailUrl = `https://img.youtube.com/vi/${detectedYtId}/maxresdefault.jpg`;
  }

  // Tags string
  const tagsStr = Array.isArray(data.tags)
    ? data.tags.join(', ')
    : (typeof data.tags === 'string' ? data.tags : null);

  return await prisma.video.create({
    data: {
      title: data.title,
      slug: uniqueSlug,
      description: data.description || null,
      videoType,
      videoUrl: rawUrl,
      youtubeId: detectedYtId || data.youtubeId || null,
      thumbnailUrl,
      duration: data.duration || '00:00',
      durationSeconds: data.durationSeconds ? Number(data.durationSeconds) : 0,
      category: (data.category || 'news').toLowerCase(),
      subCategory: data.subCategory || null,
      badge: data.badge || null,
      location: data.location || null,
      reporterName: data.reporterName || 'News Desk',
      metaTitle: data.metaTitle || data.title,
      metaDescription: data.metaDescription || (data.description ? data.description.slice(0, 160) : null),
      tags: tagsStr,
      isFeaturedHero: Boolean(data.isFeaturedHero),
      isTrending: Boolean(data.isTrending),
      status: data.status || 'PUBLISHED',
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date()
    }
  });
};

export const getVideos = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 12));
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null
  };

  if (query.status && query.status.toUpperCase() !== 'ALL') {
    where.status = query.status.toUpperCase();
  } else if (!query.status) {
    where.status = 'PUBLISHED';
  }

  if (query.category && query.category.toLowerCase() !== 'all') {
    where.category = query.category.toLowerCase();
  }

  if (typeof query.isTrending !== 'undefined') {
    where.isTrending = query.isTrending === 'true' || query.isTrending === true;
  }

  if (typeof query.isFeaturedHero !== 'undefined') {
    where.isFeaturedHero = query.isFeaturedHero === 'true' || query.isFeaturedHero === true;
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { title: { contains: s } },
      { description: { contains: s } },
      { tags: { contains: s } }
    ];
  }

  const sortBy = query.sortBy || 'publishedAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [total, videos] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    })
  ]);

  return {
    videos,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getVideoByIdOrSlug = async (idOrSlug) => {
  if (!idOrSlug) return null;

  return await prisma.video.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  });
};

export const updateVideo = async (id, data) => {
  const updateData = {};

  if (typeof data.title !== 'undefined') updateData.title = data.title;
  if (typeof data.description !== 'undefined') updateData.description = data.description;
  if (typeof data.category !== 'undefined') updateData.category = (data.category || 'news').toLowerCase();
  if (typeof data.subCategory !== 'undefined') updateData.subCategory = data.subCategory;
  if (typeof data.badge !== 'undefined') updateData.badge = data.badge;
  if (typeof data.location !== 'undefined') updateData.location = data.location;
  if (typeof data.reporterName !== 'undefined') updateData.reporterName = data.reporterName;
  if (typeof data.duration !== 'undefined') updateData.duration = data.duration;
  if (typeof data.durationSeconds !== 'undefined') updateData.durationSeconds = Number(data.durationSeconds);
  if (typeof data.metaTitle !== 'undefined') updateData.metaTitle = data.metaTitle;
  if (typeof data.metaDescription !== 'undefined') updateData.metaDescription = data.metaDescription;
  if (typeof data.status !== 'undefined') updateData.status = data.status;
  if (typeof data.isFeaturedHero !== 'undefined') updateData.isFeaturedHero = Boolean(data.isFeaturedHero);
  if (typeof data.isTrending !== 'undefined') updateData.isTrending = Boolean(data.isTrending);

  if (data.tags) {
    updateData.tags = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags;
  }

  if (data.videoUrl) {
    updateData.videoUrl = data.videoUrl;
    const detectedYtId = extractYouTubeId(data.videoUrl);
    updateData.youtubeId = detectedYtId || data.youtubeId || null;
    if (detectedYtId && !data.thumbnailUrl) {
      updateData.thumbnailUrl = `https://img.youtube.com/vi/${detectedYtId}/maxresdefault.jpg`;
    }
  }

  if (typeof data.thumbnailUrl !== 'undefined') {
    updateData.thumbnailUrl = data.thumbnailUrl;
  }

  return await prisma.video.update({
    where: { id },
    data: updateData
  });
};

export const deleteVideo = async (id) => {
  return await prisma.video.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

export const incrementViews = async (id) => {
  return await prisma.video.update({
    where: { id },
    data: { viewsCount: { increment: 1 } }
  });
};

export const getFeaturedAndTrendingVideos = async () => {
  // 1. Lead / Hero / Cover video is ALWAYS the latest published video
  const latestHero = await prisma.video.findFirst({
    where: { deletedAt: null, status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' }
  });

  // 2. Playlist / Trending videos (latest published right after lead hero)
  const heroId = latestHero ? latestHero.id : undefined;
  const trending = await prisma.video.findMany({
    where: {
      deletedAt: null,
      status: 'PUBLISHED',
      ...(heroId ? { id: { not: heroId } } : {})
    },
    take: 5,
    orderBy: { publishedAt: 'desc' }
  });

  // 3. Recent 12 Videos
  const recent = await prisma.video.findMany({
    where: { deletedAt: null, status: 'PUBLISHED' },
    take: 12,
    orderBy: { publishedAt: 'desc' }
  });

  return {
    featuredHero: latestHero,
    heroVideo: latestHero,
    trending,
    trendingVideos: trending,
    recent
  };
};
