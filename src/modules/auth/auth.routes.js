import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { loginSchema, changePasswordSchema } from './auth.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin Authentication & Password Management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@enews.com
 *               password:
 *                 type: string
 *                 example: Admin@123456
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and Admin profile
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get Logged-in Admin Profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
 *       401:
 *         description: Unauthorized / Missing or invalid token
 */
router.get('/me', authMiddleware(), authController.getMe);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change Admin Password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: Admin@123456
 *               newPassword:
 *                 type: string
 *                 example: NewPassword@1234
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Incorrect old password or validation error
 */
router.post('/change-password', authMiddleware(), validate(changePasswordSchema), authController.changePassword);

export default router;
