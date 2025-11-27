import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { logActivity, LOG_ACTION, LOG_ENTITY } from '../utils/activity-logger';

/**
 * Middleware to extract IP address and user agent from request
 */
export function getRequestInfo(req: Request): { ipAddress: string; userAgent: string } {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Middleware factory to log activity after route handler
 */
export function logActivityMiddleware(
  action: LOG_ACTION,
  entity: LOG_ENTITY,
  getEntityId?: (req: AuthenticatedRequest) => string | undefined,
  getDescription?: (req: AuthenticatedRequest) => string | undefined,
  getMetadata?: (req: AuthenticatedRequest) => Record<string, any> | undefined
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function (body: any) {
      // Only log if response is successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { ipAddress, userAgent } = getRequestInfo(req);
        const firmId = req.user?.firmId;
        const userId = req.user?.userId || null;

        if (firmId) {
          logActivity({
            firmId,
            userId,
            action,
            entity,
            entityId: getEntityId ? getEntityId(req) : undefined,
            description: getDescription ? getDescription(req) : undefined,
            metadata: getMetadata ? getMetadata(req) : undefined,
            ipAddress,
            userAgent,
          }).catch((err) => {
            console.error('Failed to log activity:', err);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper middleware to log CRUD operations
 */
export const logCreateActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.CREATE, entity, (req) => req.body?.id || req.params?.id);

export const logUpdateActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.UPDATE, entity, (req) => req.params?.id);

export const logDeleteActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.DELETE, entity, (req) => req.params?.id);

export const logViewActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.VIEW, entity, (req) => req.params?.id);

export const logDownloadActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.DOWNLOAD, entity, (req) => req.params?.id);

export const logUploadActivity = (entity: LOG_ENTITY) =>
  logActivityMiddleware(LOG_ACTION.UPLOAD, entity, (req) => req.body?.id || req.params?.id);

