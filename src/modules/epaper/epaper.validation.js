import Joi from 'joi';

export const saveSlotSchema = Joi.object({
  editionSlug: Joi.string().required(),
  publishDate: Joi.string().required(),
  pageNumber: Joi.number().integer().min(1).max(50).required(),
  slotIndex: Joi.number().integer().min(1).required(),
  x: Joi.number().optional().default(16),
  y: Joi.number().optional().default(115),
  width: Joi.number().optional().default(400),
  height: Joi.number().optional().default(250),
  headline: Joi.string().optional().allow('', null),
  subHeadline: Joi.string().optional().allow('', null),
  categoryTag: Joi.string().optional().allow('', null),
  contentText: Joi.string().optional().allow('', null),
  imageUrl: Joi.string().optional().allow('', null),
  imageAlign: Joi.string().optional().allow('', null).default('CENTER'),
  imageWidth: Joi.number().optional().allow(null),
  imageHeight: Joi.number().optional().allow(null),
  imgPxX: Joi.number().optional().allow(null),
  imgPxY: Joi.number().optional().allow(null),
  colSpan: Joi.number().integer().optional().default(8),
  rowSpan: Joi.string().optional().default('auto'),
  forceRowBreak: Joi.boolean().optional().default(false),
  isAd: Joi.boolean().optional().default(false)
});

export const publishPaperSchema = Joi.object({
  editionSlug: Joi.string().required(),
  publishDate: Joi.string().required(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED').optional().default('PUBLISHED'),
  pages: Joi.array().optional()
});

export const addPageSchema = Joi.object({
  editionSlug: Joi.string().required(),
  publishDate: Joi.string().required(),
  pageNumber: Joi.number().integer().min(1).max(50).required(),
  title: Joi.string().optional().default('City News'),
  templateKey: Joi.string().optional().default('layout_1')
});

export const generatePdfSchema = Joi.object({
  editionSlug: Joi.string().required(),
  editionName: Joi.string().optional(),
  editionTitle: Joi.string().optional(),
  editionCity: Joi.string().optional(),
  editionState: Joi.string().optional(),
  publishDate: Joi.string().required(),
  pages: Joi.array().optional()
});

export const savePagesBulkSchema = Joi.object({
  editionSlug: Joi.string().required(),
  publishDate: Joi.string().required(),
  pages: Joi.array().required()
});
