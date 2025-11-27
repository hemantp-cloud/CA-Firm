import prisma from '../../shared/utils/prisma';
import { LOG_ACTION, LOG_ENTITY } from '../../shared/utils/activity-logger';

interface GetActivityLogsParams {
  firmId: string;
  filters?: {
    action?: LOG_ACTION;
    entity?: LOG_ENTITY;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
  page?: number;
  limit?: number;
}

/**
 * Get activity logs with filters and pagination
 */
export async function getActivityLogs(params: GetActivityLogsParams) {
  const { firmId, filters = {}, page = 1, limit = 50 } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    firmId,
  };

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entity) {
    where.entityType = filters.entity;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo);
    }
  }

  if (filters.search) {
    where.OR = [
      { entityName: { contains: filters.search, mode: 'insensitive' } },
      { action: { contains: filters.search, mode: 'insensitive' } },
      { entityType: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Export activity logs to Excel format
 */
export async function exportActivityLogsToExcel(
  firmId: string,
  filters?: GetActivityLogsParams['filters']
) {
  const where: any = {
    firmId,
  };

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.entity) {
    where.entityType = filters.entity;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo);
    }
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs.map((log) => ({
    'Date & Time': log.createdAt.toISOString(),
    'User': log.user?.name || 'System',
    'Email': log.user?.email || '-',
    'Action': log.action,
    'Entity': log.entityType,
    'Entity ID': log.entityId || '-',
    'Entity Name': log.entityName || '-',
    'IP Address': log.ipAddress || '-',
    'User Agent': log.userAgent || '-',
    'Details': log.details ? JSON.stringify(log.details) : '-',
  }));
}

