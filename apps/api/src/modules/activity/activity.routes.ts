import { Router, Response } from 'express';
import { getActivityLogs, exportActivityLogsToExcel } from './activity.service';
import { authenticate, requireCA, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { LOG_ACTION, LOG_ENTITY } from '../../shared/utils/activity-logger';
import { generateExcel } from '../../shared/utils/excel-export';

const router = Router();

/**
 * GET /api/activity
 * Get activity logs with filters and pagination (CA only)
 */
router.get('/', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = req.user?.firmId;
    if (!firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const filters: any = {};
    
    if (req.query.action) {
      filters.action = req.query.action as LOG_ACTION;
    }

    if (req.query.entity) {
      filters.entity = req.query.entity as LOG_ENTITY;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom as string;
    }

    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo as string;
    }

    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await getActivityLogs({
      firmId,
      filters,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve activity logs',
    });
  }
});

/**
 * GET /api/activity/export
 * Export activity logs to Excel (CA only)
 */
router.get('/export', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = req.user?.firmId;
    if (!firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const filters: any = {};
    
    if (req.query.action) {
      filters.action = req.query.action as LOG_ACTION;
    }

    if (req.query.entity) {
      filters.entity = req.query.entity as LOG_ENTITY;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom as string;
    }

    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo as string;
    }

    const data = await exportActivityLogsToExcel(firmId, filters);
    const buffer = await generateExcel(data, 'Activity Logs');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export activity logs',
    });
  }
});

export default router;
