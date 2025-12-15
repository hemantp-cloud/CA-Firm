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
 * Converts database user to AuthenticatedUser
 */
function toAuthenticatedUser(user: any, role: string): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: role as any, // Role is validated before reaching here
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
    case 'SUPER_ADMIN':
      return '/super-admin/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'PROJECT_MANAGER':
      return '/project-manager/dashboard';
    case 'TEAM_MEMBER':
      return '/team-member/dashboard';
    case 'CLIENT':
      return '/client/dashboard';
    default:
      return '/login';
  }
}

/**
 * Checks if 2FA is required for a role
 */
function requiresTwoFactor(role: string, twoFactorEnabled: boolean): boolean {
  // Super Admin and Admin always require 2FA for security
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return true;
  }
  // Others only if enabled
  return twoFactorEnabled;
}

/**
 * Find user across all role tables
 */
async function findUserByEmail(email: string): Promise<{ user: any; role: string; table: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check Super Admin
  let user = await prisma.superAdmin.findUnique({
    where: { email: normalizedEmail },
  });
  if (user) return { user, role: 'SUPER_ADMIN', table: 'super_admins' };

  // Check Admin
  user = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });
  if (user) return { user, role: 'ADMIN', table: 'admins' };

  // Check Project Manager
  user = await prisma.projectManager.findUnique({
    where: { email: normalizedEmail },
  });
  if (user) return { user, role: 'PROJECT_MANAGER', table: 'project_managers' };

  // Check Team Member
  user = await prisma.teamMember.findUnique({
    where: { email: normalizedEmail },
  });
  if (user) return { user, role: 'TEAM_MEMBER', table: 'team_members' };

  // Check Client
  user = await prisma.client.findUnique({
    where: { email: normalizedEmail },
  });
  if (user) return { user, role: 'CLIENT', table: 'clients' };

  return null;
}

/**
 * Update user in correct table
 */
async function updateUserByRole(userId: string, role: string, data: any): Promise<void> {
  switch (role) {
    case 'SUPER_ADMIN':
      await prisma.superAdmin.update({ where: { id: userId }, data });
      break;
    case 'ADMIN':
      await prisma.admin.update({ where: { id: userId }, data });
      break;
    case 'PROJECT_MANAGER':
      await prisma.projectManager.update({ where: { id: userId }, data });
      break;
    case 'TEAM_MEMBER':
      await prisma.teamMember.update({ where: { id: userId }, data });
      break;
    case 'CLIENT':
      await prisma.client.update({ where: { id: userId }, data });
      break;
  }
}

/**
 * Handles failed login attempt
 */
async function handleFailedLogin(userId: string, role: string): Promise<void> {
  // Get current user by ID and role

  // Get current user
  let user: any;
  switch (role) {
    case 'SUPER_ADMIN':
      user = await prisma.superAdmin.findUnique({ where: { id: userId } });
      break;
    case 'ADMIN':
      user = await prisma.admin.findUnique({ where: { id: userId } });
      break;
    case 'PROJECT_MANAGER':
      user = await prisma.projectManager.findUnique({ where: { id: userId } });
      break;
    case 'TEAM_MEMBER':
      user = await prisma.teamMember.findUnique({ where: { id: userId } });
      break;
    case 'CLIENT':
      user = await prisma.client.findUnique({ where: { id: userId } });
      break;
  }

  if (!user) return;

  const newAttempts = (user.failedLoginAttempts || 0) + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);

    await updateUserByRole(userId, role, {
      failedLoginAttempts: newAttempts,
      lockedUntil,
    });
  } else {
    await updateUserByRole(userId, role, {
      failedLoginAttempts: newAttempts,
    });
  }
}

/**
 * Resets failed login attempts on successful login
 */
async function resetFailedLoginAttempts(userId: string, role: string): Promise<void> {
  await updateUserByRole(userId, role, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Login user with email and password
 * Checks all 5 role tables
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse | { requiresTwoFactor: true; email: string }> {
  console.log('LOGIN ATTEMPT:', { email, passwordLength: password?.length });

  // Find user across all tables
  const result = await findUserByEmail(email);

  console.log('FIND USER RESULT:', result ? { found: true, role: result.role, email: result.user?.email } : { found: false });

  if (!result) {
    throw new Error('Invalid credentials');
  }

  const { user, role } = result;

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
    await handleFailedLogin(user.id, role);
    throw new Error('Invalid credentials');
  }

  // Reset failed login attempts
  await resetFailedLoginAttempts(user.id, role);

  // Check if 2FA is required
  const needs2FA = requiresTwoFactor(role, user.twoFactorEnabled);

  if (needs2FA) {
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // Save OTP
    await updateUserByRole(user.id, role, {
      otpCode: otp,
      otpExpiry,
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    const response: any = {
      requiresTwoFactor: true,
      email: user.email,
    };

    // Development mode - include OTP
    if (!process.env.RESEND_API_KEY) {
      response.devOtp = otp;
      console.log('\n🔐 DEVELOPMENT MODE: OTP for', maskEmail(user.email), 'is:', otp);
      console.log('⚠️  In production, OTP will only be sent via email.\n');
    }

    return response;
  }

  // No 2FA - generate JWT
  const authenticatedUser = toAuthenticatedUser(user, role);
  const token = generateJWTToken(authenticatedUser);
  const redirectUrl = getRedirectUrl(role);

  // Update last login
  await updateUserByRole(user.id, role, {
    lastLoginAt: new Date(),
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
  // Find user
  const result = await findUserByEmail(email);

  if (!result) {
    throw new Error('Invalid credentials');
  }

  const { user, role } = result;

  // Check if active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact administrator.');
  }

  // Check if locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - new Date().getTime()) / 60000
    );
    throw new Error(
      `Account is locked. Try again in ${minutesLeft} minute(s).`
    );
  }

  // Verify OTP
  if (!user.otpCode || user.otpCode !== otp) {
    console.log(`OTP Verification Failed for ${maskEmail(email)}: Expected ${user.otpCode}, Got ${otp}`);
    throw new Error('Invalid OTP');
  }

  // Check expiry
  if (!isOTPValid(user.otpExpiry)) {
    console.log(`OTP Verification Failed for ${maskEmail(email)}: OTP Expired`);
    throw new Error('OTP has expired. Please request a new one.');
  }

  // Clear OTP
  await updateUserByRole(user.id, role, {
    otpCode: null,
    otpExpiry: null,
  });

  // Generate JWT
  const authenticatedUser = toAuthenticatedUser(user, role);
  const token = generateJWTToken(authenticatedUser);
  const redirectUrl = getRedirectUrl(role);

  // Update last login
  await updateUserByRole(user.id, role, {
    lastLoginAt: new Date(),
  });

  return {
    user: authenticatedUser,
    token,
    redirectUrl,
  };
}

/**
 * Resend OTP
 */
export async function resendOTP(email: string): Promise<{ success: boolean; email: string }> {
  const result = await findUserByEmail(email);

  if (!result) {
    throw new Error('Invalid credentials');
  }

  const { user, role } = result;

  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact administrator.');
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  await updateUserByRole(user.id, role, {
    otpCode: otp,
    otpExpiry,
  });

  await sendOTPEmail(user.email, otp, user.name);

  const response: any = {
    success: true,
    email: maskEmail(user.email),
  };

  if (!process.env.RESEND_API_KEY) {
    response.devOtp = otp;
    console.log('\n🔐 DEVELOPMENT MODE: Resent OTP for', maskEmail(user.email), 'is:', otp);
  }

  return response;
}

/**
 * Google OAuth authentication
 */
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function googleAuth(
  googleToken: string
): Promise<LoginResponse | { requiresTwoFactor: true; email: string }> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: [
        GOOGLE_CLIENT_ID,
        '507009144784-f9g7dfdgd874kklfvfp75uek3n4rmjha.apps.googleusercontent.com'
      ].filter(id => !!id),
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    const email = payload.email;

    // Find user
    const result = await findUserByEmail(email);

    if (!result) {
      throw new Error('Account not found. Please contact administrator.');
    }

    const { user, role } = result;

    if (!user.isActive) {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Link googleId if not linked
    // Note: googleId field needs to be added to all role tables if needed

    const needs2FA = requiresTwoFactor(role, user.twoFactorEnabled);

    if (needs2FA) {
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      await updateUserByRole(user.id, role, {
        otpCode: otp,
        otpExpiry,
      });

      await sendOTPEmail(user.email, otp, user.name);

      const response: any = {
        requiresTwoFactor: true,
        email: user.email,
      };

      if (!process.env.RESEND_API_KEY) {
        response.devOtp = otp;
        console.log('\n🔐 DEVELOPMENT MODE: OTP for', maskEmail(user.email), 'is:', otp);
      }

      return response;
    }

    const authenticatedUser = toAuthenticatedUser(user, role);
    const token = generateJWTToken(authenticatedUser);
    const redirectUrl = getRedirectUrl(role);

    await updateUserByRole(user.id, role, {
      lastLoginAt: new Date(),
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
  const result = await findUserByEmail(email);

  if (!result) {
    return {
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  const { user, role } = result;

  if (!user.isActive) {
    return {
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  const resetToken = uuidv4();
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  await updateUserByRole(user.id, role, {
    passwordResetToken: resetToken,
    passwordResetExpiry: resetExpiry,
  });

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

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
  // Check all tables for reset token
  let user: any = null;
  let role: string = '';

  user = await prisma.superAdmin.findFirst({ where: { passwordResetToken: token } });
  if (user) role = 'SUPER_ADMIN';

  if (!user) {
    user = await prisma.admin.findFirst({ where: { passwordResetToken: token } });
    if (user) role = 'ADMIN';
  }

  if (!user) {
    user = await prisma.projectManager.findFirst({ where: { passwordResetToken: token } });
    if (user) role = 'PROJECT_MANAGER';
  }

  if (!user) {
    user = await prisma.teamMember.findFirst({ where: { passwordResetToken: token } });
    if (user) role = 'TEAM_MEMBER';
  }

  if (!user) {
    user = await prisma.client.findFirst({ where: { passwordResetToken: token } });
    if (user) role = 'CLIENT';
  }

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updateUserByRole(user.id, role, {
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetExpiry: null,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
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
  userRole: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  // Get user from correct table
  let user: any = null;

  switch (userRole) {
    case 'SUPER_ADMIN':
      user = await prisma.superAdmin.findUnique({ where: { id: userId } });
      break;
    case 'ADMIN':
      user = await prisma.admin.findUnique({ where: { id: userId } });
      break;
    case 'PROJECT_MANAGER':
      user = await prisma.projectManager.findUnique({ where: { id: userId } });
      break;
    case 'TEAM_MEMBER':
      user = await prisma.teamMember.findUnique({ where: { id: userId } });
      break;
    case 'CLIENT':
      user = await prisma.client.findUnique({ where: { id: userId } });
      break;
  }

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.password) {
    throw new Error('Password not set. Please use password reset.');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updateUserByRole(user.id, userRole, {
    password: hashedPassword,
    mustChangePassword: false,
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
 * Get user by ID and role
 */
export async function getUserById(id: string, role: string) {
  let user: any = null;

  switch (role) {
    case 'SUPER_ADMIN':
      user = await prisma.superAdmin.findUnique({ where: { id } });
      break;
    case 'ADMIN':
      user = await prisma.admin.findUnique({ where: { id } });
      break;
    case 'PROJECT_MANAGER':
      user = await prisma.projectManager.findUnique({ where: { id } });
      break;
    case 'TEAM_MEMBER':
      user = await prisma.teamMember.findUnique({ where: { id } });
      break;
    case 'CLIENT':
      user = await prisma.client.findUnique({ where: { id } });
      break;
  }

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
