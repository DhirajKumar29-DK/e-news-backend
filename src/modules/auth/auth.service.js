import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import * as emailService from '../../services/email.service.js';

/**
 * Universal Login Service (Admin & Reporter)
 */
export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('Invalid email credentials or account inactive', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password credentials', 401);
  }

  // Reporter status checks
  if (user.role === 'REPORTER') {
    if (user.status === 'PENDING') {
      throw new AppError(
        'Aapka account abhi Admin verification ke liye pending hai. Admin approval ke baad hi aap login kar payenge.',
        403,
        { code: 'ACCOUNT_PENDING' }
      );
    }
    if (user.status === 'REJECTED') {
      const reason = user.rejectionReason ? ` Reason: ${user.rejectionReason}` : '';
      throw new AppError(
        `Your reporter registration was rejected by the administrator.${reason}`,
        403,
        { code: 'ACCOUNT_REJECTED' }
      );
    }
    if (user.status === 'SUSPENDED') {
      throw new AppError(
        'Your reporter account has been suspended by the administrator. Please contact editorial desk support.',
        403,
        { code: 'ACCOUNT_SUSPENDED' }
      );
    }
  }

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || null,
      city: user.city || null,
      state: user.state || null
    }
  };
};

/**
 * Public Reporter Self-Registration Service
 * Strictly enforces role: 'REPORTER' and status: 'PENDING'
 */
export const registerReporter = async (data) => {
  const cleanEmail = data.email.toLowerCase().trim();

  // Check existing user
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  if (existing) {
    throw new AppError('An account with this email address already exists.', 400);
  }

  // Mandatory ID Proof Check
  if (!data.idProofUrl || !data.idProofUrl.trim()) {
    throw new AppError('Aadhaar Card or Press ID document upload is mandatory for registration.', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  let preferredCatsStr = null;
  if (Array.isArray(data.preferredCategories)) {
    preferredCatsStr = data.preferredCategories.join(', ');
  } else if (typeof data.preferredCategories === 'string') {
    preferredCatsStr = data.preferredCategories.trim();
  }

  // Create new reporter with enforced role 'REPORTER' and status 'PENDING'
  const newReporter = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: data.phone ? data.phone.trim() : null,
      role: 'REPORTER', // STRICT SECURITY: Never allow public registration to set ADMIN
      status: 'PENDING', // STRICT SECURITY: Always begins as PENDING awaiting admin approval
      city: data.city ? data.city.trim() : null,
      district: data.district ? data.district.trim() : null,
      state: data.state ? data.state.trim() : null,
      bio: data.bio ? data.bio.trim() : null,
      idProofUrl: data.idProofUrl.trim(),
      idProofType: data.idProofType || 'AADHAAR',
      idProofNumber: data.idProofNumber ? data.idProofNumber.trim() : null,
      preferredCategories: preferredCatsStr
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      city: true,
      state: true,
      createdAt: true
    }
  });

  return newReporter;
};

/**
 * Get Logged-in User Profile Service (Admin or Reporter)
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      city: true,
      district: true,
      state: true,
      bio: true,
      profileImage: true,
      idProofUrl: true,
      idProofType: true,
      idProofNumber: true,
      preferredCategories: true,
      createdAt: true
    }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('User account not found or inactive', 404);
  }

  return user;
};

/**
 * Change Password Service (Validates current old password)
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError('User not found or inactive', 404);
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

/**
 * Forgot Password Service (Issues secure, single-use, expiring reset token)
 */
export const forgotPassword = async (email) => {
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  // Security: Avoid account enumeration; return generic message even if email not found
  if (!user || user.deletedAt !== null) {
    return {
      message: 'If an account exists with this email address, password reset instructions have been issued.'
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 3600000); // 1 hour validity

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: tokenExpires
    }
  });

  const resetUrl = `${env.FRONTEND_URL}/reporter/reset-password?token=${resetToken}`;
  try {
    await emailService.sendPasswordResetEmail(user, resetUrl);
    console.log(`[PASSWORD RESET EMAIL SENT] To: ${user.email} | URL: ${resetUrl}`);
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
  }

  return {
    message: 'If an account exists with this email address, password reset instructions have been issued.'
  };
};

/**
 * Reset Password Service (Verifies reset token and updates password)
 */
export const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
      deletedAt: null
    }
  });

  if (!user) {
    throw new AppError('Password reset link is invalid or has expired. Please request a new one.', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  return { message: 'Password has been reset successfully. You can now log in with your new password.' };
};


/**
 * Mobile OTP Verification Service for Reporter Registration
 */
const otpStore = new Map(); // phone -> { otp, expiresAt }
const verifiedPhones = new Map(); // phone -> expiresAt

export const sendReporterOtp = async (phone) => {
  const cleanPhone = phone?.toString().trim().replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new AppError('Please provide a valid 10-digit mobile number.', 400);
  }

  // Generate 6 digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(cleanPhone, { otp, expiresAt });
  console.log(`\n======================================================`);
  console.log(`📱 [REPORTER OTP] Phone: +91 ${cleanPhone} | OTP: ${otp}`);
  console.log(`======================================================\n`);

  return {
    phone: cleanPhone,
    otp, // Returned for instant local development and effortless testing
    expiresInSeconds: 600
  };
};

export const verifyReporterOtp = async (phone, otp) => {
  const cleanPhone = phone?.toString().trim().replace(/\D/g, '');
  const cleanOtp = otp?.toString().trim();

  if (!cleanPhone || cleanPhone.length !== 10) {
    throw new AppError('Please provide a valid 10-digit mobile number.', 400);
  }
  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new AppError('Please enter a valid 6-digit OTP.', 400);
  }

  const stored = otpStore.get(cleanPhone);
  if (!stored) {
    throw new AppError('OTP not found or has expired. Please click Resend OTP.', 400);
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanPhone);
    throw new AppError('OTP has expired. Please click Resend OTP.', 400);
  }

  if (stored.otp !== cleanOtp) {
    throw new AppError('Incorrect OTP entered. Please verify and try again.', 400);
  }

  // OTP verified successfully
  otpStore.delete(cleanPhone);
  verifiedPhones.set(cleanPhone, Date.now() + 30 * 60 * 1000);

  return {
    phone: cleanPhone,
    verified: true
  };
};

/**
 * Email OTP Verification Service for Reporter Registration
 */
const emailOtpStore = new Map(); // email -> { otp, expiresAt }
const verifiedEmails = new Map(); // email -> expiresAt

export const sendReporterEmailOtp = async (email) => {
  const cleanEmail = email?.toString().toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  // Check if an existing account with this email exists
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });
  if (existing) {
    throw new AppError('An account with this email address already exists. Please sign in.', 400);
  }

  // Generate 6 digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  emailOtpStore.set(cleanEmail, { otp, expiresAt });
  console.log(`\n======================================================`);
  console.log(`✉️ [REPORTER EMAIL OTP] Email: ${cleanEmail} | OTP: ${otp}`);
  console.log(`======================================================\n`);

  try {
    await emailService.sendReporterOtpEmail(cleanEmail, otp);
  } catch (err) {
    console.error('Failed to dispatch reporter OTP email:', err.message);
  }

  // Notice: We DO NOT return otp in the response so it is NOT exposed on screen!
  return {
    email: cleanEmail,
    expiresInSeconds: 600
  };
};

export const verifyReporterEmailOtp = async (email, otp) => {
  const cleanEmail = email?.toString().toLowerCase().trim();
  const cleanOtp = otp?.toString().trim();

  if (!cleanEmail) {
    throw new AppError('Please provide a valid email address.', 400);
  }
  if (!cleanOtp || cleanOtp.length !== 6) {
    throw new AppError('Please enter a valid 6-digit OTP.', 400);
  }

  const stored = emailOtpStore.get(cleanEmail);
  if (!stored) {
    throw new AppError('OTP not found or has expired. Please click Resend OTP.', 400);
  }

  if (Date.now() > stored.expiresAt) {
    emailOtpStore.delete(cleanEmail);
    throw new AppError('OTP has expired. Please click Resend OTP.', 400);
  }

  if (stored.otp !== cleanOtp) {
    throw new AppError('Incorrect OTP entered. Please verify and try again.', 400);
  }

  // OTP verified successfully
  emailOtpStore.delete(cleanEmail);
  verifiedEmails.set(cleanEmail, Date.now() + 30 * 60 * 1000);

  return {
    email: cleanEmail,
    verified: true
  };
};
