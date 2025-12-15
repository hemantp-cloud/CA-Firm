import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../modules/auth/auth.service';
import prisma from '../utils/prisma';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AuthenticatedUser {
  id: string;
  userId: string;
  firmId: string;
  email: string;
  name: string;
  role: string;
  clientId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
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

    // Verify JWT
    const decoded = verifyToken(token);

    // Fetch user from appropriate table based on role
    let user: any = null;

    switch (decoded.role) {
      case 'SUPER_ADMIN':
        user = await prisma.superAdmin.findUnique({
          where: { id: decoded.userId },
          select: { id: true, isActive: true, name: true, deletedAt: true },
        });
        break;
      case 'ADMIN':
        user = await prisma.admin.findUnique({
          where: { id: decoded.userId },
          select: { id: true, isActive: true, name: true, deletedAt: true },
        });
        break;
      case 'PROJECT_MANAGER':
        user = await prisma.projectManager.findUnique({
          where: { id: decoded.userId },
          select: { id: true, isActive: true, name: true, deletedAt: true },
        });
        break;
      case 'TEAM_MEMBER':
        user = await prisma.teamMember.findUnique({
          where: { id: decoded.userId },
          select: { id: true, isActive: true, name: true, deletedAt: true },
        });
        break;
      case 'CLIENT':
        user = await prisma.client.findUnique({
          where: { id: decoded.userId },
          select: { id: true, isActive: true, name: true, deletedAt: true },
        });
        break;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive || user.deletedAt) {
      res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    // Attach user info to request
    // For CLIENT role, clientId is their own ID
    const clientId = decoded.role === 'CLIENT' ? decoded.userId : null;

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      firmId: decoded.firmId,
      email: decoded.email,
      name: user.name,
      role: decoded.role,
      clientId,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invalid or expired token',
    });
  }
};

// ============================================
// ROLE-BASED MIDDLEWARE
// ============================================

/**
 * Require SUPER_ADMIN or ADMIN role
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
    return;
  }

  next();
};

/**
 * Require SUPER_ADMIN only
 */
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin role required.',
    });
    return;
  }

  next();
};

/**
 * Require PROJECT_MANAGER role
 * SUPER_ADMIN, ADMIN, and PROJECT_MANAGER can access
 */
export const requireProjectManager = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Project Manager role required.',
    });
    return;
  }

  next();
};

/**
 * Require TEAM_MEMBER role
 * SUPER_ADMIN, ADMIN, PROJECT_MANAGER, and TEAM_MEMBER can access
 */
export const requireTeamMember = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Team Member role required.',
    });
    return;
  }

  next();
};

/**
 * Require CLIENT role
 * Any authenticated user can access
 */
export const requireClient = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  next();
};

/**
 * Require ownership of resource
 */
export const requireOwnership = (field: 'userId', paramName: string = field) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // SUPER_ADMIN and ADMIN can access everything
    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    const resourceId = req.params[paramName];

    if (!resourceId) {
      res.status(400).json({
        success: false,
        message: `Resource ID (${paramName}) is required`,
      });
      return;
    }

    if (field === 'userId') {
      if (req.user.userId !== resourceId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
        });
        return;
      }
    }

    next();
  };
};

// ============================================
// COMBINED MIDDLEWARE
// ============================================

export const requireAuthAndAdmin = [authenticate, requireAdmin];
export const requireAuthAndSuperAdmin = [authenticate, requireSuperAdmin];
export const requireAuthAndProjectManager = [authenticate, requireProjectManager];
export const requireAuthAndTeamMember = [authenticate, requireTeamMember];
export const requireAuthAndClient = [authenticate, requireClient];

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================

/**
 * @deprecated Use requireProjectManager instead
 */
export const requireCA = requireProjectManager;

/**
 * @deprecated Use requireAuthAndProjectManager instead
 */
export const requireAuthAndCA = requireAuthAndProjectManager;

/**
 * @deprecated Use requireProjectManager instead
 */
export const requireAdminOrCA = requireProjectManager;
