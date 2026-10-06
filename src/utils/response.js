/**
 * Centralized API Response Utility
 */

export const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = 'Error occurred', errors = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
