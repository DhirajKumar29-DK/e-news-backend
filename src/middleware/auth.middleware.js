import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'Authentication token missing or invalid', null, 401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return sendError(res, 'Access denied: Insufficient privileges', null, 403);
      }

      next();
    } catch (error) {
      return sendError(res, 'Invalid or expired token', null, 401);
    }
  };
};
