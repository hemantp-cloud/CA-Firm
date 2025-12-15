import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Log an activity to the activity_logs table
 */
export async function logActivity(
    firmId: string,
    userId: string,
    userType: string,
    action: string,
    entityType: string,
    entityId: string | null = null,
    entityName: string | null = null,
    details: Prisma.InputJsonValue | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                firmId,
                userId,
                userType,
                action,
                entityType,
                entityId,
                entityName,
                details: details ?? Prisma.JsonNull,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        // Don't throw - logging should not break the main operation
        console.error('Failed to log activity:', error);
    }
}

/**
 * Log user login activity
 */
export async function logLogin(
    firmId: string,
    userId: string,
    userType: string,
    userName: string,
    ipAddress: string | null = null,
    userAgent: string | null = null
): Promise<void> {
    await logActivity(
        firmId,
        userId,
        userType,
        'LOGIN',
        'USER',
        userId,
        userName,
        { timestamp: new Date().toISOString() },
        ipAddress,
        userAgent
    );
}

/**
 * Log user creation activity
 */
export async function logUserCreation(
    firmId: string,
    createdBy: string,
    creatorType: string,
    newUserId: string,
    newUserName: string,
    newUserRole: string
): Promise<void> {
    await logActivity(
        firmId,
        createdBy,
        creatorType,
        'CREATE',
        newUserRole,
        newUserId,
        newUserName,
        { role: newUserRole }
    );
}

/**
 * Log user deletion/deactivation activity
 */
export async function logUserDeletion(
    firmId: string,
    deletedBy: string,
    deleterType: string,
    targetUserId: string,
    targetUserName: string,
    targetUserRole: string,
    permanent: boolean = false
): Promise<void> {
    await logActivity(
        firmId,
        deletedBy,
        deleterType,
        'DELETE',
        targetUserRole,
        targetUserId,
        targetUserName,
        { permanent, description: permanent ? 'permanently deleted' : 'deactivated' }
    );
}

/**
 * Log document activity
 */
export async function logDocumentActivity(
    firmId: string,
    userId: string,
    userType: string,
    action: string,
    documentId: string,
    documentName: string,
    details: Prisma.InputJsonValue | null = null
): Promise<void> {
    await logActivity(
        firmId,
        userId,
        userType,
        action,
        'DOCUMENT',
        documentId,
        documentName,
        details
    );
}

/**
 * Log service activity
 */
export async function logServiceActivity(
    firmId: string,
    userId: string,
    userType: string,
    action: string,
    serviceId: string,
    serviceName: string,
    details: Prisma.InputJsonValue | null = null
): Promise<void> {
    await logActivity(
        firmId,
        userId,
        userType,
        action,
        'SERVICE',
        serviceId,
        serviceName,
        details
    );
}

export default {
    logActivity,
    logLogin,
    logUserCreation,
    logUserDeletion,
    logDocumentActivity,
    logServiceActivity,
};
