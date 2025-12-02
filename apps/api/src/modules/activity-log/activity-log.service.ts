import prisma from '../../shared/utils/prisma';

export interface CreateActivityLogParams {
    firmId: string;
    userId?: string;
    documentId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an activity log entry
 */
export async function createActivityLog(params: CreateActivityLogParams) {
    return await prisma.activityLog.create({
        data: {
            firmId: params.firmId,
            userId: params.userId || null,
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

    if (filters.documentId) {
        where.documentId = filters.documentId;
    }

    if (filters.entityType) {
        where.entityType = filters.entityType;
    }

    return await prisma.activityLog.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
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
}

/**
 * Get activity history for a specific document
 */
export async function getDocumentHistory(documentId: string) {
    return await prisma.activityLog.findMany({
        where: {
            documentId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
}

/**
 * Get recent activity for a firm
 */
export async function getRecentActivity(firmId: string, limit: number = 20) {
    return await prisma.activityLog.findMany({
        where: {
            firmId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
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
}
