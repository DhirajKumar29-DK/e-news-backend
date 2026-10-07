import { sendError } from '../utils/response.js';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, allowUnknown: true, stripUnknown: false });
    if (error) {
      const details = error.details.map((detail) => detail.message);
      console.warn(`⚠️ [Validation 400 on ${req.method} ${req.originalUrl}]:`, details);
      return sendError(res, 'Validation Error', details, 400);
    }
    req[property] = value;
    next();
  };
};
