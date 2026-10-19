import * as videoService from './video.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const createVideo = async (req, res, next) => {
  try {
    const { title, videoUrl } = req.body;
    if (!title || !videoUrl) {
      return sendError(res, 'Title and videoUrl are required', null, 400);
    }
    const video = await videoService.createVideo(req.body);
    return sendSuccess(res, 'Video created successfully', video, 201);
  } catch (error) {
    next(error);
  }
};

export const getVideos = async (req, res, next) => {
  try {
    const result = await videoService.getVideos(req.query);
    return sendSuccess(res, 'Videos retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedAndTrending = async (req, res, next) => {
  try {
    const result = await videoService.getFeaturedAndTrendingVideos();
    return sendSuccess(res, 'Featured and trending videos retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getVideoByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const video = await videoService.getVideoByIdOrSlug(idOrSlug);
    if (!video) {
      return sendError(res, 'Video not found', null, 404);
    }
    return sendSuccess(res, 'Video details retrieved successfully', video);
  } catch (error) {
    next(error);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const video = await videoService.updateVideo(id, req.body);
    return sendSuccess(res, 'Video updated successfully', video);
  } catch (error) {
    next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    await videoService.deleteVideo(id);
    return sendSuccess(res, 'Video deleted successfully (soft delete)');
  } catch (error) {
    next(error);
  }
};

export const incrementViews = async (req, res, next) => {
  try {
    const { id } = req.params;
    await videoService.incrementViews(id);
    return sendSuccess(res, 'Views count incremented');
  } catch (error) {
    next(error);
  }
};

export const uploadVideoFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No video file uploaded', null, 400);
    }
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    return sendSuccess(res, 'Video file uploaded successfully', {
      videoUrl,
      fileName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const syncYouTube = async (req, res, next) => {
  try {
    const { channelInput, category } = req.body || {};
    const { syncYouTubeVideos } = await import('./youtubeSync.service.js');
    const result = await syncYouTubeVideos(channelInput, category);
    return sendSuccess(res, 'YouTube channel synced successfully', result);
  } catch (error) {
    return sendError(res, error.message || 'Failed to sync YouTube channel', null, 500);
  }
};

export const getYoutubeSyncStatus = async (req, res, next) => {
  try {
    const { getSyncStatus } = await import('./youtubeSync.service.js');
    const status = getSyncStatus();
    return sendSuccess(res, 'YouTube sync status retrieved', status);
  } catch (error) {
    next(error);
  }
};
