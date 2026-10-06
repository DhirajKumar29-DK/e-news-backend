import Joi from 'joi';

export const createEditionSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Edition name is required (e.g. Patna Main)'
  }),
  city: Joi.string().required().messages({
    'any.required': 'City name is required'
  }),
  slug: Joi.string().lowercase().required().messages({
    'any.required': 'URL slug is required (e.g. patna-main)'
  }),
  code: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional().default(true)
});

export const updateEditionSchema = Joi.object({
  name: Joi.string().optional(),
  city: Joi.string().optional(),
  slug: Joi.string().lowercase().optional(),
  code: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional()
});
