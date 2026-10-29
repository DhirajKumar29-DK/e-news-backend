import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadIdProof } from '../../middleware/upload.middleware.js';
import {
  loginSchema,
  reporterRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.validation.js';

const router = Router();

// 1. Universal Login (Admin & Reporter)
router.post('/login', validate(loginSchema), authController.login);

// 2. Public Reporter Registration
router.post('/register', validate(reporterRegisterSchema), authController.registerReporter);

// 3. Upload ID Proof / Press Card Document (Multipart)
router.post('/upload-id-proof', uploadIdProof.single('idProof'), authController.uploadIdProofDoc);

// 4. Authenticated Profile Details
router.get('/me', authMiddleware(), authController.getMe);

// 5. Change Password (Authenticated)
router.post('/change-password', authMiddleware(), validate(changePasswordSchema), authController.changePassword);

// 6. Forgot Password (Public request reset token)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// 7. Reset Password (Public with token)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
