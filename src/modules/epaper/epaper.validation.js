import Joi from 'joi';

export const saveSlotSchema = Joi.object({
  editionSlug: Joi.string().optional(),
  edition: Joi.string().optional(),
  publishDate: Joi.string().optional(),
  date: Joi.string().optional(),
  pageNumber: Joi.number().integer().min(1).max(50).optional().default(1),
  slotIndex: Joi.number().integer().min(0).optional().default(1),
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
}).unknown(true);

export const publishPaperSchema = Joi.object({
  editionSlug: Joi.string().optional(),
  edition: Joi.string().optional(),
  publishDate: Joi.string().optional(),
  date: Joi.string().optional(),
  status: Joi.string().optional().default('PUBLISHED'),
  pages: Joi.array().optional()
}).unknown(true);

export const addPageSchema = Joi.object({
  editionSlug: Joi.string().optional(),
  edition: Joi.string().optional(),
  publishDate: Joi.string().optional(),
  date: Joi.string().optional(),
  pageNumber: Joi.number().integer().min(1).max(50).optional().default(1),
  title: Joi.string().optional().default('City News'),
  templateKey: Joi.string().optional().default('layout_1')
}).unknown(true);

export const generatePdfSchema = Joi.object({
  editionSlug: Joi.string().optional(),
  edition: Joi.string().optional(),
  editionName: Joi.string().optional(),
  editionTitle: Joi.string().optional(),
  editionCity: Joi.string().optional(),
  editionState: Joi.string().optional(),
  publishDate: Joi.string().optional(),
  date: Joi.string().optional(),
  pages: Joi.array().optional()
}).unknown(true);

export const savePagesBulkSchema = Joi.object({
  editionSlug: Joi.string().optional(),
  edition: Joi.string().optional(),
  publishDate: Joi.string().optional(),
  date: Joi.string().optional(),
  pages: Joi.array().optional().default([])
}).unknown(true);

