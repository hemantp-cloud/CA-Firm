import { Router, Response } from 'express';
import { getActivityLogs, getDocumentHistory } from './activity-log.service';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/activity-logs
 * Get activity logs with filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        if (!firmId) {
            res.status(400).json({
                success: false,
                message: 'Firm ID not found',
            });
            return;
        }

        const filters = {
            firmId,
            ...(req.query.userId && { userId: req.query.userId as string }),
            ...(req.query.documentId && { documentId: req.query.documentId as string }),
            ...(req.query.entityType && { entityType: req.query.entityType as string }),
            ...(req.query.limit && { limit: parseInt(req.query.limit as string) }),
            ...(req.query.offset && { offset: parseInt(req.query.offset as string) }),
        };

        const logs = await getActivityLogs(filters);

        res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error: any) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch activity logs',
        });
    }
});

/**
 * GET /api/activity-logs/document/:documentId
 * Get activity history for a specific document
 */
router.get('/document/:documentId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            res.status(400).json({
                success: false,
                message: 'Document ID is required',
            });
            return;
        }

        const history = await getDocumentHistory(documentId);

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error: any) {
        console.error('Error fetching document history:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch document history',
        });
    }
});

export default router;
