import prisma from '../../shared/utils/prisma';

export interface CreateActivityLogParams {
    firmId: string;
    userId?: string | null;
    userType?: string; // "SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"
    documentId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    entityName?: string | null;
    details?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
}

/**
 * Create an activity log entry
 */
export async function createActivityLog(params: CreateActivityLogParams) {
    return await prisma.activityLog.create({
        data: {
            firmId: params.firmId,
            userId: params.userId || null,
            userType: params.userType || null,
            documentId: params.documentId || null,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId || null,
            entityName: params.entityName || null,
            details: params.details || null,
            ipAddress: params.ipAddress || null,
            userAgent: params.userAgent || null,
        },
    });
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(filters: {
    firmId: string;
    userId?: string;
    userType?: string;
    documentId?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = {
        firmId: filters.firmId,
    };

    if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.userType) {
        where.userType = filters.userType;
    }

    if (filters.documentId) {
        where.documentId = filters.documentId;
    }

    if (filters.entityType) {
        where.entityType = filters.entityType;
    }

    const logs = await prisma.activityLog.findMany({
        where,
        include: {
            document: {
                select: {
                    id: true,
                    fileName: true,
                    documentType: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
    });

    // Return with formatted data
    return logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));
}

/**
 * Get activity history for a specific document
 */
export async function getDocumentHistory(documentId: string) {
    const logs = await prisma.activityLog.findMany({
        where: {
            documentId,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    return logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));
}

/**
 * Get recent activity for a firm
 */
export async function getRecentActivity(firmId: string, limit: number = 20) {
    const logs = await prisma.activityLog.findMany({
        where: {
            firmId,
        },
        include: {
            document: {
                select: {
                    id: true,
                    fileName: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
    });

    return logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));
}

/**
 * Get activity by entity
 */
export async function getActivityByEntity(entityType: string, entityId: string) {
    const logs = await prisma.activityLog.findMany({
        where: {
            entityType,
            entityId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
    }));
}
