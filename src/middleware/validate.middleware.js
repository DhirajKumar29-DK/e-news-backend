import { sendError } from '../utils/response.js';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const details = error.details.map((detail) => detail.message);
      return sendError(res, 'Validation Error', details, 400);
    }
    next();
  };
};
