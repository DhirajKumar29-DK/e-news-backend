import * as articleService from './article.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { env } from '../../config/env.js';

export const createArticle = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return sendError(res, 'Title, content and category are required', null, 400);
    }
    const article = await articleService.createArticle(req.body, req.user);
    return sendSuccess(res, 'Article created successfully', article, 201);
  } catch (error) {
    next(error);
  }
};

export const getArticles = async (req, res, next) => {
  try {
    const result = await articleService.getArticles(req.query, req.user);
    return sendSuccess(res, 'Articles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getHomeArticles = async (req, res, next) => {
  try {
    const result = await articleService.getHomeArticles();
    return sendSuccess(res, 'Homepage articles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getArticleByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const article = await articleService.getArticleByIdOrSlug(idOrSlug, req.user);
    if (!article) {
      return sendError(res, 'Article not found', null, 404);
    }
    return sendSuccess(res, 'Article details retrieved successfully', article);
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await articleService.updateArticle(id, req.body, req.user);
    return sendSuccess(res, 'Article updated successfully', article);
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await articleService.deleteArticle(id, req.user);
    return sendSuccess(res, 'Article deleted successfully (soft delete)');
  } catch (error) {
    next(error);
  }
};

export const reviewArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await articleService.reviewArticle(id, req.body, req.user);
    return sendSuccess(res, `Article review completed: status is now ${result.status}`, result);
  } catch (error) {
    next(error);
  }
};

export const getReviewQueue = async (req, res, next) => {
  try {
    const result = await articleService.getReviewQueue(req.query);
    return sendSuccess(res, 'Editorial review queue retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded', null, 400);
    }
    const relativeUrl = `/uploads/articles/${req.file.filename}`;
    let imageUrl = relativeUrl;
    if (env.API_BASE_URL) {
      const clean = env.API_BASE_URL.replace(/\/$/, '').replace(/\/api\/v1$/, '');
      imageUrl = `${clean}${relativeUrl}`;
    } else {
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      imageUrl = `${protocol}://${host}${relativeUrl}`;
    }
    return sendSuccess(res, 'Image uploaded successfully', {
      imageUrl,
      relativeUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
};
