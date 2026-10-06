import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';

/**
 * Admin Login Service
 */
export const loginAdmin = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('Invalid email credentials or account inactive', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 401);
  }

  // Generate JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * Get Logged-in Admin Profile Service
 */
export const getAdminProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('Admin user not found', 404);
  }

  return user;
};

/**
 * Change Admin Password Service
 */
export const changeAdminPassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('Admin user not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });

  return { message: 'Password updated successfully' };
};
