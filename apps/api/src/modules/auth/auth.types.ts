import { Role } from '@prisma/client';

// ============================================
// REQUEST TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface GoogleAuthRequest {
  googleToken: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId: string | null;
  firmId: string;
  twoFactorEnabled: boolean;
  mustChangePassword: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
  requiresTwoFactor: boolean;
  redirectUrl?: string;
}

export interface VerifyOtpResponse {
  user: AuthenticatedUser;
  token: string;
  redirectUrl?: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

