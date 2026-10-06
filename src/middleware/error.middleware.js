import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error Stack:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  return sendError(res, message, errors, statusCode);
};
