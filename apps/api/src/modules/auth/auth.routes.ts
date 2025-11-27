import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  login,
  verifyOTP,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  getUserById,
  verifyToken,
  resendOTP,
} from './auth.service';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid token format'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    firmId: string;
    email: string;
    role: string;
  };
}

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token || token.trim() === '') {
      res.status(401).json({
        success: false,
        message: 'Token is missing',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid or expired token',
    });
  }
};

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { email, password } = validationResult.data;

    // Call login service
    const result = await login(email, password);

    // Check if 2FA is required
    if ('requiresTwoFactor' in result && result.requiresTwoFactor && 'email' in result) {
      res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        email: result.email,
        message: 'OTP has been sent to your email',
      });
      return;
    }

    // Return token and user data
    if ('user' in result && 'token' in result) {
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          redirectUrl: result.redirectUrl,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and complete login
 */
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = verifyOtpSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { email, otp } = validationResult.data;

    // Call verify OTP service
    const result = await verifyOTP(email, otp);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        redirectUrl: result.redirectUrl,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'OTP verification failed',
    });
  }
});

/**
 * POST /api/auth/google
 * Google OAuth authentication
 */
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = googleAuthSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { credential } = validationResult.data;

    // Call Google auth service
    const result = await googleAuth(credential);

    // Check if 2FA is required
    if ('requiresTwoFactor' in result && result.requiresTwoFactor && 'email' in result) {
      res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        email: result.email,
        message: 'OTP has been sent to your email',
      });
      return;
    }

    // Return token and user data
    if ('user' in result && 'token' in result) {
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          redirectUrl: result.redirectUrl,
        },
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Google authentication failed',
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { email } = validationResult.data;

    // Call forgot password service
    const result = await forgotPassword(email);

    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Always return success for security (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { token, newPassword } = validationResult.data;

    // Call reset password service
    const result = await resetPassword(token, newPassword);

    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = changePasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Call change password service
    const result = await changePassword(req.user.userId, currentPassword, newPassword);

    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password change failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Get user data
    const user = await getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (frontend clears token)
 */
router.post('/logout', authenticate, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Just return success - frontend will clear the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 */
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validationResult = resendOtpSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const { email } = validationResult.data;

    // Call resend OTP service
    const result = await resendOTP(email);

    const response: any = {
      success: result.success,
      email: result.email,
      message: 'OTP has been resent to your email',
    };

    // Include dev OTP in development mode
    if ((result as any).devOtp) {
      response.devOtp = (result as any).devOtp;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to resend OTP',
    });
  }
});

export default router;
