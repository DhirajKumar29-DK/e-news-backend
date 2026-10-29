import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const reporterRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Full Name is required',
    'string.min': 'Name must be at least 2 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email address is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().trim().min(8).max(20).required().messages({
    'any.required': 'Mobile phone number is required'
  }),
  city: Joi.string().trim().allow('', null),
  district: Joi.string().trim().allow('', null),
  state: Joi.string().trim().allow('', null),
  bio: Joi.string().trim().max(1000).allow('', null),
  idProofUrl: Joi.string().trim().required().messages({
    'any.required': 'Identity proof document (Aadhaar Card or Press Card) is mandatory',
    'string.empty': 'Identity proof document (Aadhaar Card or Press Card) is mandatory'
  }),
  idProofType: Joi.string().trim().valid('AADHAAR', 'PRESS_ID', 'VOTER_ID', 'OTHER').default('AADHAAR'),
  idProofNumber: Joi.string().trim().allow('', null),
  preferredCategories: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).allow(null)
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email address is required'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Password reset token is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});
