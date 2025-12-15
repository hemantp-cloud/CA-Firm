import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../shared/utils/prisma';
import { verifyToken, UserPayload } from '../auth/auth.service';
import { ServiceStatus } from '@prisma/client';

const router = Router();

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Middleware function extractUser that gets token from Authorization header, verifies it, and attaches decoded user to req.user
const extractUser = async (
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

    // Verify token and attach decoded user to req.user
    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Apply extractUser to all routes
router.use(extractUser);

/**
 * GET /api/analytics/dashboard
 * Return comprehensive dashboard statistics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Total revenue (sum of paid invoices)
    const totalRevenueResult = await prisma.invoice.aggregate({
      where: {
        firmId,
        status: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    });
    const totalRevenue = Number(totalRevenueResult._sum.totalAmount || 0);

    // Active services count
    const activeServicesCount = await prisma.service.count({
      where: {
        firmId,
        status: {
          in: ['IN_PROGRESS', 'UNDER_REVIEW'] as ServiceStatus[],
        },
      },
    });

    // Pending tasks count
    const pendingTasksCount = await prisma.task.count({
      where: {
        service: {
          firmId,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'] as ServiceStatus[],
        },
      },
    });

    // New clients this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newClientsThisMonth = await prisma.client.count({
      where: {
        firmId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const invoicesLast6Months = await prisma.invoice.findMany({
      where: {
        firmId,
        invoiceDate: {
          gte: sixMonthsAgo,
        },
        status: 'PAID',
      },
      select: {
        invoiceDate: true,
        totalAmount: true,
      },
    });

    // Group revenue by month
    const revenueByMonth: Record<string, number> = {};
    invoicesLast6Months.forEach((invoice) => {
      const monthKey = invoice.invoiceDate.toISOString().substring(0, 7); // YYYY-MM
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(invoice.totalAmount);
    });

    // Format revenue by month for last 6 months
    const revenueByMonthArray = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      revenueByMonthArray.push({
        month: monthKey,
        revenue: revenueByMonth[monthKey] || 0,
      });
    }

    // Services by status (pie chart data)
    const servicesByStatus = await prisma.service.groupBy({
      by: ['status'],
      where: {
        firmId,
      },
      _count: {
        id: true,
      },
    });

    const servicesByStatusData = servicesByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        service: {
          firmId,
        },
      },
      _count: {
        id: true,
      },
    });

    const tasksByPriorityData = tasksByPriority.map((item: any) => ({
      priority: item.priority,
      count: item._count?.id || 0,
    }));

    // Top clients by revenue
    const topClients = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: {
        firmId,
        status: 'PAID',
        clientId: {
          not: null as any,
        },
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    });

    // Get client details for top clients
    const topClientsWithDetails = await Promise.all(
      topClients.map(async (item) => {
        if (!item.clientId) {
          return {
            clientId: null,
            clientName: 'Unknown',
            revenue: Number(item._sum?.totalAmount || 0),
          };
        }
        const client = await prisma.client.findUnique({
          where: { id: item.clientId },
          select: { id: true, name: true },
        });
        return {
          clientId: item.clientId,
          clientName: client?.name || 'Unknown',
          revenue: Number(item._sum?.totalAmount || 0),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        activeServicesCount,
        pendingTasksCount,
        newClientsThisMonth,
        revenueByMonth: revenueByMonthArray,
        servicesByStatus: servicesByStatusData,
        tasksByPriority: tasksByPriorityData,
        topClients: topClientsWithDetails,
      },
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve dashboard analytics',
    });
  }
});

/**
 * GET /api/analytics/revenue
 * Detailed revenue analytics
 */
router.get('/revenue', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Total revenue
    const totalRevenueResult = await prisma.invoice.aggregate({
      where: {
        firmId,
        status: 'PAID',
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Revenue by status
    const revenueByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        firmId,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const invoicesLast12Months = await prisma.invoice.findMany({
      where: {
        firmId,
        invoiceDate: {
          gte: twelveMonthsAgo,
        },
        status: 'PAID',
      },
      select: {
        invoiceDate: true,
        totalAmount: true,
      },
    });

    const revenueByMonth: Record<string, number> = {};
    invoicesLast12Months.forEach((invoice) => {
      const monthKey = invoice.invoiceDate.toISOString().substring(0, 7);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(invoice.totalAmount);
    });

    const revenueByMonthArray = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      revenueByMonthArray.push({
        month: monthKey,
        revenue: revenueByMonth[monthKey] || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenueResult._sum.totalAmount || 0),
        revenueByStatus: revenueByStatus.map((item) => ({
          status: item.status,
          revenue: Number(item._sum.totalAmount || 0),
        })),
        revenueByMonth: revenueByMonthArray,
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve revenue analytics',
    });
  }
});

/**
 * GET /api/analytics/services
 * Service analytics
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Services by status
    const servicesByStatus = await prisma.service.groupBy({
      by: ['status'],
      where: {
        firmId,
      },
      _count: {
        id: true,
      },
    });

    // Services by service type (using 'type' field, not 'serviceTypeId')
    const servicesByType = await prisma.service.groupBy({
      by: ['type'],
      where: {
        firmId,
      },
      _count: {
        id: true,
      },
    });

    // Map service types to readable names
    const servicesByTypeWithNames = servicesByType.map((item: any) => {
      const typeNameMap: Record<string, string> = {
        ITR_FILING: 'ITR Filing',
        GST_REGISTRATION: 'GST Registration',
        GST_RETURN: 'GST Return',
        TDS_RETURN: 'TDS Return',
        TDS_COMPLIANCE: 'TDS Compliance',
        ROC_FILING: 'ROC Filing',
        AUDIT: 'Audit',
        BOOK_KEEPING: 'Book Keeping',
        PAYROLL: 'Payroll',
        CONSULTATION: 'Consultation',
        OTHER: 'Other',
      };
      return {
        type: item.type,
        typeName: typeNameMap[item.type] || item.type,
        count: item._count?.id || 0,
      };
    });

    // Services created by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const servicesLast6Months = await prisma.service.findMany({
      where: {
        firmId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const servicesByMonth: Record<string, number> = {};
    servicesLast6Months.forEach((service) => {
      const monthKey = service.createdAt.toISOString().substring(0, 7);
      servicesByMonth[monthKey] = (servicesByMonth[monthKey] || 0) + 1;
    });

    const servicesByMonthArray = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      servicesByMonthArray.push({
        month: monthKey,
        count: servicesByMonth[monthKey] || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        servicesByStatus: servicesByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        servicesByType: servicesByTypeWithNames,
        servicesByMonth: servicesByMonthArray,
      },
    });
  } catch (error) {
    console.error('Get service analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve service analytics',
    });
  }
});

/**
 * GET /api/analytics/tasks
 * Task analytics
 */
router.get('/tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }

    const firmId = req.user.firmId;

    // Tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: {
        service: {
          firmId,
        },
      },
      _count: {
        id: true,
      },
    });

    // Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        service: {
          firmId,
        },
      },
      _count: {
        id: true,
      },
    });

    // Overdue tasks count
    const now = new Date();
    const overdueTasksCount = await prisma.task.count({
      where: {
        service: {
          firmId,
        },
        dueDate: {
          lt: now,
        },
        status: {
          not: 'COMPLETED' as ServiceStatus,
        },
      },
    });

    // Tasks completed by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const completedTasksLast6Months = await prisma.task.findMany({
      where: {
        service: {
          firmId,
        },
        status: 'COMPLETED' as ServiceStatus,
        completedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        completedAt: true,
      },
    });

    const tasksCompletedByMonth: Record<string, number> = {};
    completedTasksLast6Months.forEach((task: any) => {
      if (task.completedAt) {
        const monthKey = task.completedAt.toISOString().substring(0, 7);
        tasksCompletedByMonth[monthKey] = (tasksCompletedByMonth[monthKey] || 0) + 1;
      }
    });

    const tasksCompletedByMonthArray = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      tasksCompletedByMonthArray.push({
        month: monthKey,
        count: tasksCompletedByMonth[monthKey] || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tasksByStatus: tasksByStatus.map((item: any) => ({
          status: item.status,
          count: item._count?.id || 0,
        })),
        tasksByPriority: tasksByPriority.map((item: any) => ({
          priority: item.priority,
          count: item._count?.id || 0,
        })),
        overdueTasksCount,
        tasksCompletedByMonth: tasksCompletedByMonthArray,
      },
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve task analytics',
    });
  }
});

export default router;
