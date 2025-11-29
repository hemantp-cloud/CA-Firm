import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  generateOTP,
  generateOTPExpiry,
  isOTPValid,
  maskEmail,
} from '../../utils/otp';
import {
  sendOTPEmail,
  sendPasswordResetEmail,
} from '../../utils/email';
import {
  AuthenticatedUser,
  LoginResponse,
  VerifyOtpResponse,
  ForgotPasswordResponse,
  PasswordResetResponse,
} from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const RESET_TOKEN_EXPIRY_HOURS = 1;

// ============================================
// JWT TOKEN TYPES
// ============================================

export interface UserPayload {
  userId: string;
  firmId: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generates JWT token for authenticated user
 */
function generateJWTToken(user: AuthenticatedUser): string {
  const payload: UserPayload = {
    userId: user.id,
    firmId: user.firmId,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Converts Prisma User to AuthenticatedUser
 */
function toAuthenticatedUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
    firmId: user.firmId,
    twoFactorEnabled: user.twoFactorEnabled,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
  };
}

/**
 * Gets redirect URL based on user role
 */
export function getRedirectUrl(role: string): string {
  switch (role) {
    case 'CA':
      return '/ca/dashboard';
    case 'CLIENT':
      return '/client/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/404notfound';
  }
}

/**
 * Checks if 2FA is required for a role
 * CA and CLIENT always require 2FA, USER is optional
 */
function requiresTwoFactor(role: string, twoFactorEnabled: boolean): boolean {
  if (role === 'CA' || role === 'CLIENT') {
    return true;
  }
  return twoFactorEnabled;
}

/**
 * Handles failed login attempt
 * Locks account after MAX_FAILED_ATTEMPTS for LOCKOUT_DURATION_MINUTES
 */
async function handleFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  }) as any;

  if (!user) return;

  const newAttempts = ((user.failedLoginAttempts as number) || 0) + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    // Lock account
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      } as any,
    });
  } else {
    // Increment failed attempts
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
      } as any,
    });
  }
}

/**
 * Resets failed login attempts on successful login
 */
async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    } as any,
  });
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Login user with email and password
 * Handles 2FA, account locking, and failed login attempts
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse | { requiresTwoFactor: true; email: string }> {
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
  }) as any;

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact administrator.');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - new Date().getTime()) / 60000
    );
    throw new Error(
      `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`
    );
  }

  // Verify password
  if (!user.password) {
    throw new Error('Password not set. Please use password reset.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // Handle failed login attempt
    await handleFailedLogin(user.id);
    throw new Error('Invalid credentials');
  }

  // Reset failed login attempts on successful password verification
  await resetFailedLoginAttempts(user.id);

  // Check if 2FA is required
  const needs2FA = requiresTwoFactor(user.role, user.twoFactorEnabled);

  if (needs2FA) {
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // Save OTP and expiry to user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry,
      } as any,
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    // Return 2FA required response
    // In development mode (no RESEND_API_KEY), include OTP in response for testing
    const response: any = {
      requiresTwoFactor: true,
      email: user.email, // Send full email so frontend can use it for verification
    };

    // Include OTP in development mode for easier testing
    if (!process.env.RESEND_API_KEY) {
      response.devOtp = otp;
      console.log('\n🔐 DEVELOPMENT MODE: OTP for', maskEmail(user.email), 'is:', otp);
      console.log('⚠️  In production, OTP will only be sent via email.\n');
    }

    return response;
  }

  // 2FA not required - generate JWT and return
  const authenticatedUser = toAuthenticatedUser(user);
  const token = generateJWTToken(authenticatedUser);
  const redirectUrl = getRedirectUrl(user.role);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    } as any,
  });

  return {
    user: authenticatedUser,
    token,
    requiresTwoFactor: false,
    redirectUrl,
  };
}

/**
 * Verify OTP and complete login
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
  }) as any;

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact administrator.');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - new Date().getTime()) / 60000
    );
    throw new Error(
      `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`
    );
  }

  // Verify OTP
  if (!user.otpCode || user.otpCode !== otp) {
    console.log(`OTP Verification Failed for ${maskEmail(email)}: Expected ${user.otpCode}, Got ${otp}`);
    throw new Error('Invalid OTP');
  }

  // Check if OTP is expired
  if (!isOTPValid(user.otpExpiry)) {
    console.log(`OTP Verification Failed for ${maskEmail(email)}: OTP Expired`);
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Clear OTP fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: null,
      otpExpiry: null,
    } as any,
  });

  // Generate JWT token
  const authenticatedUser = toAuthenticatedUser(user);
  const token = generateJWTToken(authenticatedUser);
  const redirectUrl = getRedirectUrl(user.role);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    } as any,
  });

  return {
    user: authenticatedUser,
    token,
    redirectUrl,
  };
}

/**
 * Resend OTP to user's email
 */
export async function resendOTP(email: string): Promise<{ success: boolean; email: string }> {
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
  }) as any;

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact administrator.');
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  // Save OTP and expiry to user record
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: otp,
      otpExpiry,
    } as any,
  });

  // Send OTP email
  await sendOTPEmail(user.email, otp, user.name);

  const response: any = {
    success: true,
    email: maskEmail(user.email),
  };

  // Include OTP in development mode for easier testing
  if (!process.env.RESEND_API_KEY) {
    response.devOtp = otp;
    console.log('\n🔐 DEVELOPMENT MODE: Resent OTP for', maskEmail(user.email), 'is:', otp);
    console.log('⚠️  In production, OTP will only be sent via email.\n');
  }

  return response;
}

/**
 * Google OAuth authentication
 * TODO: Implement Google token verification with google-auth-library
 */
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Google OAuth authentication
 */
export async function googleAuth(
  googleToken: string
): Promise<LoginResponse | { requiresTwoFactor: true; email: string }> {
  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: [
        GOOGLE_CLIENT_ID,
        '507009144784-f9g7dfdgd874kklfvfp75uek3n4rmjha.apps.googleusercontent.com'
      ].filter(id => !!id),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token');
    }

    const googleId = payload.sub;
    const email = payload.email;

    if (!email) {
      throw new Error('Email not found in Google token');
    }

    // Find user by googleId OR email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: email.toLowerCase().trim() },
        ],
      },
    }) as any;

    if (!user) {
      throw new Error('Account not found. Please contact administrator.');
    }

    // CA and Client can use Google login if their email matches
    // Admin creates the account first, so we just link it here


    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Link googleId if not already linked
    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId } as any,
      });
      user.googleId = googleId;
    }

    // Check if 2FA is required
    // CLIENT always requires 2FA, USER only if enabled
    const needs2FA = requiresTwoFactor(user.role, user.twoFactorEnabled);

    if (needs2FA) {
      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      // Save OTP and expiry to user record
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: otp,
          otpExpiry,
        } as any,
      });

      // Send OTP email
      await sendOTPEmail(user.email, otp, user.name);

      // Return 2FA required response
      const response: any = {
        requiresTwoFactor: true,
        email: user.email, // Send full email so frontend can use it for verification
      };

      // Include OTP in development mode for easier testing
      if (!process.env.RESEND_API_KEY) {
        response.devOtp = otp;
        console.log('\n🔐 DEVELOPMENT MODE: OTP for', maskEmail(user.email), 'is:', otp);
        console.log('⚠️  In production, OTP will only be sent via email.\n');
      }

      return response;
    }

    // 2FA not required - generate JWT and return
    const authenticatedUser = toAuthenticatedUser(user);
    const token = generateJWTToken(authenticatedUser);
    const redirectUrl = getRedirectUrl(user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      } as any,
    });

    return {
      user: authenticatedUser,
      token,
      requiresTwoFactor: false,
      redirectUrl,
    };
  } catch (error: any) {
    console.error('Google auth error:', error);
    throw new Error(error.message || 'Google authentication failed');
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
  });

  // Always return success (don't reveal if email exists)
  if (!user) {
    return {
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  // Check if user is active
  if (!user.isActive) {
    return {
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  // Generate reset token (UUID)
  const resetToken = uuidv4();
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  // Save token and expiry to user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    } as any,
  });

  // Generate reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  // Send password reset email
  await sendPasswordResetEmail(user.email, resetLink, user.name);

  return {
    success: true,
    message: 'If an account exists, a password reset link has been sent.',
  };
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  // Find user by reset token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
    } as any,
  }) as any;

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Check if token is expired
  if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    } as any,
  });

  return {
    success: true,
    message: 'Password reset successful. You can now login with your new password.',
  };
}

/**
 * Change password for logged-in user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  // Find user by id
  const user = await prisma.user.findUnique({
    where: { id: userId },
  }) as any;

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  if (!user.password) {
    throw new Error('Password not set. Please use password reset.');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and set mustChangePassword to false
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    } as any,
  });

  return {
    success: true,
    message: 'Password changed successfully.',
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firmId: true,
      email: true,
      name: true,
      role: true,
      clientId: true,
      phone: true,
      isActive: true,
      twoFactorEnabled: true,
      mustChangePassword: true,
      createdAt: true,
    } as any,
  });

  return user;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): UserPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
