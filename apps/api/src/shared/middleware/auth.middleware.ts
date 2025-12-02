import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../modules/auth/auth.service';
import prisma from '../utils/prisma';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AuthenticatedUser {
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
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
      return;
    }

    // Extract token (remove "Bearer " prefix if present)
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

    // Verify and decode JWT token
    const decoded = verifyToken(token);

    // Fetch user from database to get clientId and verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        clientId: true,
        isActive: true,
        name: true,
      } as any,
    }) as any;

    if (!user) {
      res.status(401).json({
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

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      firmId: decoded.firmId,
      email: decoded.email,
      name: user.name,
      role: decoded.role,
      clientId: user.clientId || null,
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
 * Require ADMIN role
 * Only ADMIN (super admin) can access
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

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. ADMIN role required.',
    });
    return;
  }

  next();
};

/**
 * Require CA role
 * ADMIN and CA can access
 */
export const requireCA = (
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

  if (req.user.role !== 'ADMIN' && req.user.role !== 'CA') {
    res.status(403).json({
      success: false,
      message: 'Access denied. ADMIN or CA role required.',
    });
    return;
  }

  next();
};

/**
 * Require CLIENT role
 * Any authenticated user can access (ADMIN, CA, or CLIENT)
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

  // Any authenticated user can access
  next();
};

/**
 * Require ownership of resource
 * Checks if user owns the resource based on userId or clientId
 * 
 * Usage:
 * requireOwnership('userId') - checks if req.params.userId matches req.user.userId
 * requireOwnership('clientId') - checks if resource belongs to user's clientId
 * requireOwnership('userId', 'id') - checks if req.params.id matches req.user.userId
 */
export const requireOwnership = (field: 'userId' | 'clientId', paramName: string = field) => {
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

    // ADMIN can access everything
    if (req.user.role === 'ADMIN') {
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
      // Check if user owns the resource
      if (req.user.userId !== resourceId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
        });
        return;
      }
    } else if (field === 'clientId') {
      // Check if resource belongs to user's client
      if (!req.user.clientId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Client ID not found.',
        });
        return;
      }

      // For CA role, check if resource belongs to their clientId
      // For CLIENT role, check if resource belongs to their clientId
      // Note: This is a basic check - you may need to customize based on the resource type
      // For example, for Services, check service.userId or service.clientId
      // For Users, check user.clientId
      try {
        // Check if the resource (User) belongs to the user's clientId
        const resource = await prisma.user.findUnique({
          where: { id: resourceId },
          select: {
            clientId: true,
          } as any,
        }) as any;

        if (!resource) {
          res.status(404).json({
            success: false,
            message: 'Resource not found',
          });
          return;
        }

        if (resource.clientId !== req.user.clientId) {
          res.status(403).json({
            success: false,
            message: 'Access denied. Resource does not belong to your client.',
          });
          return;
        }
      } catch (error) {
        console.error('Ownership check error:', error);
        res.status(500).json({
          success: false,
          message: 'Error checking resource ownership',
        });
        return;
      }
    }

    next();
  };
};

/**
 * Combined middleware: authenticate + requireAdmin
 */
export const requireAuthAndAdmin = [authenticate, requireAdmin];

/**
 * Combined middleware: authenticate + requireCA
 */
export const requireAuthAndCA = [authenticate, requireCA];

/**
 * Combined middleware: authenticate + requireClient
 */
export const requireAuthAndClient = [authenticate, requireClient];
