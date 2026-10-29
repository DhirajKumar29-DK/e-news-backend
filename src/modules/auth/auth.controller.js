import { sendSuccess, sendError } from '../../utils/response.js';
import * as authService from './auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return sendSuccess(res, 'Logged in successfully', result);
  } catch (error) {
    next(error);
  }
};

export const registerReporter = async (req, res, next) => {
  try {
    const result = await authService.registerReporter(req.body);
    return sendSuccess(
      res,
      'Registration submitted successfully! Your account is currently under administrative verification. You will be able to access the newsroom once approved.',
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    return sendSuccess(res, 'Profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    return sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return sendSuccess(res, result.message, result.resetToken ? { resetToken: result.resetToken } : null);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

export const uploadIdProofDoc = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No ID proof document file was provided', null, 400);
    }
    const fileUrl = `/uploads/id_proofs/${req.file.filename}`;
    return sendSuccess(res, 'ID proof document uploaded successfully', { fileUrl });
  } catch (error) {
    return sendError(res, error.message || 'File upload failed', null, 500);
  }
};
