import * as articleService from './article.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const createArticle = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return sendError(res, 'Title, content and category are required', null, 400);
    }
    const article = await articleService.createArticle(req.body);
    return sendSuccess(res, 'Article created successfully', article, 201);
  } catch (error) {
    next(error);
  }
};

export const getArticles = async (req, res, next) => {
  try {
    const result = await articleService.getArticles(req.query);
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
    const article = await articleService.getArticleByIdOrSlug(idOrSlug);
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
    const article = await articleService.updateArticle(id, req.body);
    return sendSuccess(res, 'Article updated successfully', article);
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await articleService.deleteArticle(id);
    return sendSuccess(res, 'Article deleted successfully (soft delete)');
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded', null, 400);
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/uploads/articles/${req.file.filename}`;
    return sendSuccess(res, 'Image uploaded successfully', {
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
};
