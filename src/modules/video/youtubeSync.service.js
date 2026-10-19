import { prisma } from '../../config/db.js';

let lastSyncState = {
  lastSyncTime: null,
  lastSyncCount: 0,
  channelId: null,
  channelTitle: null,
  status: 'IDLE',
  error: null
};

/**
 * Normalizes text to a clean URL-friendly slug
 */
function slugify(text) {
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

/**
 * Resolves any YouTube URL, handle (@name), or Channel ID into a valid UC... channelId
 */
export async function resolveChannelId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already a 24-character YouTube Channel ID starting with 'UC'
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Construct target URL for handle or user page
  let targetUrl = trimmed;
  if (trimmed.startsWith('@')) {
    targetUrl = `https://www.youtube.com/${trimmed}`;
  } else if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.youtube.com/@${trimmed}`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.warn(`[YouTubeSync] Could not fetch channel page: HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    const m1 = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    const m2 = html.match(/itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/);
    const m3 = html.match(/itemprop="identifier" content="(UC[a-zA-Z0-9_-]+)"/);
    const m4 = html.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    const m5 = html.match(/channel_id=(UC[a-zA-Z0-9_-]+)/);
    const m6 = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);

    return m1?.[1] || m2?.[1] || m3?.[1] || m4?.[1] || m5?.[1] || m6?.[1] || null;
  } catch (err) {
    console.error('[YouTubeSync] Failed to resolve channel handle/URL:', err.message);
    return null;
  }
}

/**
 * Fetches latest videos from YouTube's official Public RSS Feed (Zero API Key needed)
 */
async function fetchVideosFromFeed(channelId) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  if (!res.ok) {
    throw new Error(`YouTube Feed returned status ${res.status}`);
  }

  const xml = await res.text();
  const channelTitleMatch = xml.match(/<author>\s*<name>([^<]+)<\/name>/i);
  const channelTitle = channelTitleMatch ? channelTitleMatch[1].trim() : 'YouTube News';

  const entries = xml.split('<entry>').slice(1);
  const videos = [];

  for (const entryXml of entries) {
    const idMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
    const pubMatch = entryXml.match(/<published>([^<]+)<\/published>/);
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const thumbMatch = entryXml.match(/<media:thumbnail\s+url="([^"]+)"/);

    if (idMatch && titleMatch) {
      const videoId = idMatch[1].trim();
      const rawTitle = titleMatch[1].trim();
      // Decode HTML entities in title
      const cleanTitle = rawTitle
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      videos.push({
        videoId,
        title: cleanTitle,
        description: descMatch ? descMatch[1].trim() : '',
        publishedAt: pubMatch ? new Date(pubMatch[1]) : new Date(),
        thumbnailUrl: thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle
      });
    }
  }

  return { channelTitle, videos };
}

function parseIsoDuration(isoDuration) {
  if (!isoDuration) return { duration: '00:00', seconds: 0 };
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { duration: '00:00', seconds: 0 };
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const formatted = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { duration: formatted, seconds: totalSeconds };
}

/**
 * Fetches latest videos from official YouTube Data API v3 (when API Key is present)
 */
async function fetchVideosFromAPI(channelId, apiKey) {
  const uploadsPlaylistId = channelId.startsWith('UC') ? 'UU' + channelId.substring(2) : channelId;
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=15&key=${apiKey}`;

  const res = await fetch(playlistUrl);
  if (!res.ok) {
    throw new Error(`YouTube API returned status ${res.status}`);
  }
  const data = await res.json();
  const items = data.items || [];
  if (items.length === 0) return { channelTitle: 'YouTube News', videos: [] };

  const channelTitle = items[0]?.snippet?.channelTitle || 'YouTube News';
  const videoIds = items.map(it => it.snippet?.resourceId?.videoId).filter(Boolean);

  let durationMap = {};
  if (videoIds.length > 0) {
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
      const detRes = await fetch(detailsUrl);
      if (detRes.ok) {
        const detData = await detRes.json();
        (detData.items || []).forEach(item => {
          durationMap[item.id] = parseIsoDuration(item.contentDetails?.duration);
        });
      }
    } catch {
      // Non-critical
    }
  }

  const videos = items.map(it => {
    const videoId = it.snippet?.resourceId?.videoId;
    const dur = durationMap[videoId] || { duration: '00:00', seconds: 0 };
    return {
      videoId,
      title: it.snippet?.title || '',
      description: it.snippet?.description || '',
      publishedAt: it.snippet?.publishedAt ? new Date(it.snippet.publishedAt) : new Date(),
      thumbnailUrl: it.snippet?.thumbnails?.maxres?.url || it.snippet?.thumbnails?.high?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      channelTitle,
      duration: dur.duration,
      durationSeconds: dur.seconds
    };
  });

  return { channelTitle, videos };
}

/**
 * Main Sync Engine: Pulls new videos and safely inserts them into the database
 */
export async function syncYouTubeVideos(customChannelInput = null, category = 'news') {
  const envChannel = process.env.YOUTUBE_CHANNEL_ID;
  const channelInput = customChannelInput || envChannel;

  if (!channelInput) {
    // If no channel is configured, remain idle and do not sync random videos
    return {
      success: true,
      message: 'No YouTube channel configured yet. Auto-sync is idle.',
      newVideosAdded: 0,
      alreadyExisted: 0,
      totalFetched: 0
    };
  }

  lastSyncState.status = 'SYNCING';

  try {
    const channelId = await resolveChannelId(channelInput);
    if (!channelId) {
      throw new Error(`Unable to resolve YouTube Channel ID from input: "${channelInput}"`);
    }

    let channelTitle = 'YouTube News';
    let videos = [];
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Use official Google API if key is present, otherwise seamless Public Feed
    if (apiKey) {
      try {
        const apiRes = await fetchVideosFromAPI(channelId, apiKey);
        channelTitle = apiRes.channelTitle;
        videos = apiRes.videos;
      } catch (apiErr) {
        console.warn('[YouTubeSync] Google API notice, falling back to Public Feed:', apiErr.message);
        const feedRes = await fetchVideosFromFeed(channelId);
        channelTitle = feedRes.channelTitle;
        videos = feedRes.videos;
      }
    } else {
      const feedRes = await fetchVideosFromFeed(channelId);
      channelTitle = feedRes.channelTitle;
      videos = feedRes.videos;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const v of videos) {
      // 1. Check if this YouTube video already exists in the database (including soft-deleted)
      const existing = await prisma.video.findFirst({
        where: {
          OR: [
            { youtubeId: v.videoId },
            { videoUrl: { contains: v.videoId } }
          ]
        }
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // 2. Generate clean, guaranteed-unique SEO slug using title + videoId
      let baseSlug = slugify(v.title);
      if (!baseSlug || baseSlug.length < 2) baseSlug = 'video';
      baseSlug = baseSlug.substring(0, 70).replace(/-+$/, '');
      let uniqueSlug = `${baseSlug}-${v.videoId.toLowerCase()}`;

      // Extra safety check in DB with while-loop guarantee
      let attempts = 0;
      while (await prisma.video.findUnique({ where: { slug: uniqueSlug } })) {
        attempts++;
        uniqueSlug = `${baseSlug}-${v.videoId.toLowerCase()}-${attempts}`;
      }

      // 3. Save into Database
      await prisma.video.create({
        data: {
          title: v.title,
          slug: uniqueSlug,
          description: v.description ? v.description.substring(0, 1500) : null,
          videoType: 'URL',
          videoUrl: v.videoUrl,
          youtubeId: v.videoId,
          thumbnailUrl: v.thumbnailUrl,
          duration: '00:00',
          durationSeconds: 0,
          category: (category || 'news').toLowerCase(),
          reporterName: v.channelTitle || 'YouTube Desk',
          status: 'PUBLISHED',
          publishedAt: v.publishedAt || new Date()
        }
      });

      createdCount++;
    }

    lastSyncState = {
      lastSyncTime: new Date(),
      lastSyncCount: createdCount,
      channelId,
      channelTitle,
      status: 'SUCCESS',
      error: null
    };

    console.log(`[YouTubeSync] ✅ Synced channel "${channelTitle}" (${channelId}): ${createdCount} new video(s) added, ${skippedCount} already existed.`);

    return {
      success: true,
      channelId,
      channelTitle,
      newVideosAdded: createdCount,
      alreadyExisted: skippedCount,
      totalFetched: videos.length,
      lastSyncTime: lastSyncState.lastSyncTime
    };

  } catch (err) {
    console.error('[YouTubeSync] ❌ Sync error:', err.message);
    lastSyncState.status = 'ERROR';
    lastSyncState.error = err.message;
    throw err;
  }
}

/**
 * Returns the current sync status
 */
export function getSyncStatus() {
  return {
    ...lastSyncState,
    configuredChannel: process.env.YOUTUBE_CHANNEL_ID || null
  };
}
