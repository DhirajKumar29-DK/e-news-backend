import { sendSuccess } from '../../utils/response.js';
import * as authService from './auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    return sendSuccess(res, 'Admin logged in successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getAdminProfile(req.user.id);
    return sendSuccess(res, 'Admin profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changeAdminPassword(req.user.id, oldPassword, newPassword);
    return sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};
