import prisma from '../../shared/utils/prisma';
import { ServiceType, RequestStatus, RequestUrgency, ServiceOrigin } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface UserContext {
    id: string;
    role: string;
    firmId: string;
    name: string;
}

interface CreateRequestData {
    serviceType: ServiceType;
    title: string;
    description?: string;
    urgency?: RequestUrgency;
    preferredDueDate?: string;
    financialYear?: string;
    assessmentYear?: string;
}

// ============================================
// SERVICE REQUEST CRUD
// ============================================

/**
 * Create a new service request (Client only)
 */
export async function createServiceRequest(
    user: UserContext,
    data: CreateRequestData
) {
    if (user.role !== 'CLIENT') {
        throw new Error('Only clients can create service requests');
    }

    const request = await prisma.serviceRequest.create({
        data: {
            firmId: user.firmId,
            clientId: user.id,
            serviceType: data.serviceType,
            title: data.title,
            description: data.description || null,
            urgency: data.urgency || 'NORMAL',
            preferredDueDate: data.preferredDueDate ? new Date(data.preferredDueDate) : null,
            financialYear: data.financialYear || null,
            assessmentYear: data.assessmentYear || null,
            status: 'PENDING',
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // TODO: Send notification to PMs/Admins

    return request;
}

/**
 * Get all service requests with role-based filtering
 */
export async function getServiceRequests(
    user: UserContext,
    filters: {
        status?: RequestStatus;
        serviceType?: ServiceType;
        clientId?: string;
    } = {}
) {
    const where: any = {
        firmId: user.firmId,
    };

    // Role-based filtering
    if (user.role === 'CLIENT') {
        where.clientId = user.id;
    } else if (user.role === 'PROJECT_MANAGER') {
        // PM can see requests from their managed clients
        const managedClients = await prisma.client.findMany({
            where: {
                firmId: user.firmId,
                managedBy: user.id,
                deletedAt: null,
            },
            select: { id: true },
        });
        where.clientId = { in: managedClients.map(c => c.id) };
    }
    // ADMIN and SUPER_ADMIN see all requests

    // Apply filters
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.serviceType) {
        where.serviceType = filters.serviceType;
    }
    if (filters.clientId && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        where.clientId = filters.clientId;
    }

    return await prisma.serviceRequest.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            attachments: true,
        },
        orderBy: [
            { urgency: 'desc' },
            { createdAt: 'desc' },
        ],
    });
}

/**
 * Get a single service request by ID
 */
export async function getServiceRequestById(
    requestId: string,
    user: UserContext
) {
    const request = await prisma.serviceRequest.findFirst({
        where: {
            id: requestId,
            firmId: user.firmId,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            attachments: true,
            convertedToService: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                },
            },
        },
    });

    if (!request) {
        throw new Error('Service request not found');
    }

    // Check access
    if (user.role === 'CLIENT' && request.clientId !== user.id) {
        throw new Error('Access denied');
    }

    return request;
}

/**
 * Approve a service request and convert to service
 */
export async function approveServiceRequest(
    requestId: string,
    user: UserContext,
    data: {
        approvalNotes?: string;
        quotedFee?: number | null;
        dueDate?: string;
    }
) {
    // Only PM or higher can approve
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can approve requests');
    }

    const request = await prisma.serviceRequest.findFirst({
        where: {
            id: requestId,
            firmId: user.firmId,
            status: 'PENDING',
        },
        include: {
            client: true,
        },
    });

    if (!request) {
        throw new Error('Service request not found or already processed');
    }

    // Create service from request
    const service = await prisma.service.create({
        data: {
            firmId: user.firmId,
            clientId: request.clientId,
            projectManagerId: request.client.managedBy || null,
            type: request.serviceType,
            title: request.title,
            description: request.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : request.preferredDueDate,
            feeAmount: data.quotedFee || request.quotedFee || null,
            status: 'PENDING',
            origin: 'CLIENT_REQUEST' as ServiceOrigin,
            serviceRequestId: request.id,
            financialYear: request.financialYear,
            assessmentYear: request.assessmentYear,
            createdBy: user.id,
            createdByRole: user.role,
            createdByName: user.name,
        },
    });

    // Update request status
    const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
            status: 'CONVERTED',
            reviewedBy: user.id,
            reviewedByRole: user.role,
            reviewedByName: user.name,
            reviewedAt: new Date(),
            approvalNotes: data.approvalNotes || null,
            quotedFee: data.quotedFee || null,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            convertedToService: true,
        },
    });

    // Log service creation
    await prisma.serviceStatusHistory.create({
        data: {
            firmId: user.firmId,
            serviceId: service.id,
            fromStatus: null,
            toStatus: 'PENDING',
            action: 'CREATE_FROM_REQUEST',
            changedBy: user.id,
            changedByType: user.role,
            changedByName: user.name,
            notes: `Created from service request: ${request.title}`,
            metadata: { requestId: request.id },
        },
    });

    // TODO: Send notification to client

    return { request: updatedRequest, service };
}

/**
 * Reject a service request
 */
export async function rejectServiceRequest(
    requestId: string,
    user: UserContext,
    rejectionReason: string
) {
    // Only PM or higher can reject
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can reject requests');
    }

    const request = await prisma.serviceRequest.findFirst({
        where: {
            id: requestId,
            firmId: user.firmId,
            status: 'PENDING',
        },
    });

    if (!request) {
        throw new Error('Service request not found or already processed');
    }

    const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
            status: 'REJECTED',
            reviewedBy: user.id,
            reviewedByRole: user.role,
            reviewedByName: user.name,
            reviewedAt: new Date(),
            rejectionReason,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // TODO: Send notification to client

    return updatedRequest;
}

/**
 * Cancel a service request (Client only)
 */
export async function cancelServiceRequest(
    requestId: string,
    user: UserContext
) {
    const request = await prisma.serviceRequest.findFirst({
        where: {
            id: requestId,
            firmId: user.firmId,
            clientId: user.id,
            status: 'PENDING',
        },
    });

    if (!request) {
        throw new Error('Service request not found or cannot be cancelled');
    }

    return await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
            status: 'CANCELLED',
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

/**
 * Get service request statistics
 */
export async function getServiceRequestStats(
    user: UserContext
) {
    const where: any = {
        firmId: user.firmId,
    };

    if (user.role === 'CLIENT') {
        where.clientId = user.id;
    } else if (user.role === 'PROJECT_MANAGER') {
        const managedClients = await prisma.client.findMany({
            where: {
                firmId: user.firmId,
                managedBy: user.id,
                deletedAt: null,
            },
            select: { id: true },
        });
        where.clientId = { in: managedClients.map(c => c.id) };
    }

    const stats = await prisma.serviceRequest.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    const result: Record<string, number> = {
        PENDING: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
        CONVERTED: 0,
    };

    stats.forEach((s) => {
        result[s.status] = s._count;
    });

    return {
        ...result,
        total: Object.values(result).reduce((a, b) => a + b, 0),
    };
}
