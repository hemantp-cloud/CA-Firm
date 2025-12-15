import prisma from '../../shared/utils/prisma';
import { ServiceStatus, ServiceType } from '@prisma/client';

// Note: ServiceOrigin, RequestStatus, RequestUrgency are available from @prisma/client when needed
// Note: isValidStatusTransition is available for validation if needed

// ============================================
// TYPE DEFINITIONS
// ============================================

interface UserContext {
    id: string;
    role: string;
    firmId: string;
    name: string;
}

interface CreateServiceData {
    clientId: string;
    type: ServiceType;
    title: string;
    description?: string;
    financialYear?: string;
    assessmentYear?: string;
    dueDate?: string;
    feeAmount?: number | null;
    notes?: string;
    internalNotes?: string;
    assignToId?: string;
    assignToType?: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}

// ============================================
// SERVICE STATUS HISTORY
// ============================================

/**
 * Log a status change in the history
 */
async function logStatusChange(
    firmId: string,
    serviceId: string,
    fromStatus: ServiceStatus | null,
    toStatus: ServiceStatus,
    action: string,
    user: UserContext,
    reason?: string,
    notes?: string,
    metadata?: any
) {
    return await prisma.serviceStatusHistory.create({
        data: {
            firmId,
            serviceId,
            fromStatus,
            toStatus,
            action,
            changedBy: user.id,
            changedByType: user.role,
            changedByName: user.name,
            reason,
            notes,
            metadata,
        },
    });
}

// ============================================
// ENHANCED SERVICE CRUD
// ============================================

/**
 * Create a new service with enhanced workflow support
 */
export async function createEnhancedService(
    user: UserContext,
    data: CreateServiceData
) {
    const {
        clientId,
        type,
        title,
        description,
        financialYear,
        assessmentYear,
        dueDate,
        feeAmount,
        notes,
        internalNotes,
        assignToId,
        assignToType,
    } = data;

    // Verify client exists and belongs to the firm
    const client = await prisma.client.findFirst({
        where: {
            id: clientId,
            firmId: user.firmId,
            deletedAt: null,
        },
    });

    if (!client) {
        throw new Error('Client not found or invalid');
    }

    // Get PM from client if exists (legacy support)
    const projectManagerId = client.managedBy || null;

    // Create the service
    const service = await prisma.service.create({
        data: {
            firmId: user.firmId,
            clientId,
            projectManagerId,
            type,
            title,
            description: description || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            feeAmount: feeAmount || null,
            notes: notes || null,
            internalNotes: internalNotes || null,
            status: 'PENDING',
            origin: 'FIRM_CREATED',
            financialYear: financialYear || null,
            assessmentYear: assessmentYear || null,
            createdBy: user.id,
            createdByRole: user.role,
            createdByName: user.name,
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

    // Log the creation
    await logStatusChange(
        user.firmId,
        service.id,
        null,
        'PENDING',
        'CREATE',
        user,
        undefined,
        'Service created'
    );

    // Auto-assign if specified
    if (assignToId && assignToType) {
        await assignService(service.id, user, {
            assigneeId: assignToId,
            assigneeType: assignToType,
        });
    }

    return service;
}

/**
 * Get service by ID with enhanced workflow data
 */
export async function getEnhancedServiceById(
    serviceId: string,
    user: UserContext
) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
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
            projectManager: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            tasks: {
                orderBy: { createdAt: 'desc' },
            },
            documents: {
                where: { isDeleted: false },
                orderBy: { uploadedAt: 'desc' },
            },
            assignments: {
                orderBy: { assignedAt: 'desc' },
            },
            statusHistory: {
                orderBy: { changedAt: 'desc' },
                take: 20, // Last 20 status changes
            },
            serviceRequest: true,
        },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    // Check access permissions
    if (!canAccessService(service, user)) {
        throw new Error('Access denied');
    }

    return service;
}

/**
 * Check if user can access a service
 */
function canAccessService(service: any, user: UserContext): boolean {
    // SUPER_ADMIN and ADMIN can access all
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return true;
    }

    // PROJECT_MANAGER can access services they manage or are assigned to
    if (user.role === 'PROJECT_MANAGER') {
        return (
            service.projectManagerId === user.id ||
            service.currentAssigneeId === user.id
        );
    }

    // TEAM_MEMBER can only access assigned services
    if (user.role === 'TEAM_MEMBER') {
        return service.currentAssigneeId === user.id;
    }

    // CLIENT can only access their own services
    if (user.role === 'CLIENT') {
        return service.clientId === user.id;
    }

    return false;
}

// ============================================
// SERVICE ASSIGNMENT
// ============================================

/**
 * Assign a service to a PM or TM
 */
export async function assignService(
    serviceId: string,
    user: UserContext,
    data: {
        assigneeId: string;
        assigneeType: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
        notes?: string;
    }
) {
    const { assigneeId, assigneeType, notes: _notes } = data;

    // Get the service
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    // Validate status - can only assign from PENDING
    if (service.status !== 'PENDING') {
        throw new Error(`Cannot assign service in ${service.status} status. Use delegate instead.`);
    }

    // Get assignee info
    let assigneeName = '';
    if (assigneeType === 'PROJECT_MANAGER') {
        const pm = await prisma.projectManager.findFirst({
            where: { id: assigneeId, firmId: user.firmId, deletedAt: null },
        });
        if (!pm) throw new Error('Project Manager not found');
        assigneeName = pm.name;
    } else {
        const tm = await prisma.teamMember.findFirst({
            where: { id: assigneeId, firmId: user.firmId, deletedAt: null },
        });
        if (!tm) throw new Error('Team Member not found');
        assigneeName = tm.name;
    }

    // Create assignment record
    const assignment = await prisma.serviceAssignment.create({
        data: {
            firmId: user.firmId,
            serviceId,
            assigneeId,
            assigneeType,
            assigneeName,
            assignedBy: user.id,
            assignedByType: user.role,
            assignedByName: user.name,
            delegationLevel: 1,
            assignmentType: 'INITIAL',
            status: 'ACTIVE',
        },
    });

    // Update service
    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
            status: 'ASSIGNED',
            currentAssigneeId: assigneeId,
            currentAssigneeType: assigneeType,
            currentAssigneeName: assigneeName,
        },
        include: {
            client: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    // Log status change
    await logStatusChange(
        user.firmId,
        serviceId,
        'PENDING',
        'ASSIGNED',
        'ASSIGN',
        user,
        undefined,
        `Assigned to ${assigneeName} (${assigneeType})`,
        { assigneeId, assigneeType, assigneeName }
    );

    return { service: updatedService, assignment };
}

/**
 * Delegate a service to another PM or TM
 */
export async function delegateService(
    serviceId: string,
    user: UserContext,
    data: {
        assigneeId: string;
        assigneeType: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
        delegationReason?: string;
    }
) {
    const { assigneeId, assigneeType, delegationReason } = data;

    // Get the service
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    // Validate status
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(service.status)) {
        throw new Error(`Cannot delegate service in ${service.status} status`);
    }

    // Check if user can delegate (must be current assignee or admin)
    const canDelegate =
        ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ||
        service.currentAssigneeId === user.id;

    if (!canDelegate) {
        throw new Error('Only the current assignee or admin can delegate this service');
    }

    // Get assignee info
    let assigneeName = '';
    if (assigneeType === 'PROJECT_MANAGER') {
        const pm = await prisma.projectManager.findFirst({
            where: { id: assigneeId, firmId: user.firmId, deletedAt: null },
        });
        if (!pm) throw new Error('Project Manager not found');
        assigneeName = pm.name;
    } else {
        const tm = await prisma.teamMember.findFirst({
            where: { id: assigneeId, firmId: user.firmId, deletedAt: null },
        });
        if (!tm) throw new Error('Team Member not found');
        assigneeName = tm.name;
    }

    // Get current active assignment
    const currentAssignment = await prisma.serviceAssignment.findFirst({
        where: {
            serviceId,
            status: 'ACTIVE',
        },
        orderBy: { assignedAt: 'desc' },
    });

    // Update old assignment status
    if (currentAssignment) {
        await prisma.serviceAssignment.update({
            where: { id: currentAssignment.id },
            data: { status: 'DELEGATED' },
        });
    }

    // Create new assignment
    const newDelegationLevel = (currentAssignment?.delegationLevel || 0) + 1;
    const assignment = await prisma.serviceAssignment.create({
        data: {
            firmId: user.firmId,
            serviceId,
            assigneeId,
            assigneeType,
            assigneeName,
            assignedBy: user.id,
            assignedByType: user.role,
            assignedByName: user.name,
            delegationLevel: newDelegationLevel,
            previousAssignmentId: currentAssignment?.id || null,
            delegationReason: delegationReason || null,
            assignmentType: 'DELEGATION',
            status: 'ACTIVE',
        },
    });

    // Update service current assignee
    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
            currentAssigneeId: assigneeId,
            currentAssigneeType: assigneeType,
            currentAssigneeName: assigneeName,
        },
        include: {
            client: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    // Log the delegation (no status change)
    await logStatusChange(
        user.firmId,
        serviceId,
        service.status,
        service.status,
        'DELEGATE',
        user,
        delegationReason,
        `Delegated from ${service.currentAssigneeName || 'Unknown'} to ${assigneeName}`,
        {
            previousAssigneeId: service.currentAssigneeId,
            newAssigneeId: assigneeId,
            delegationLevel: newDelegationLevel
        }
    );

    return { service: updatedService, assignment };
}

/**
 * Get assignment history for a service
 */
export async function getAssignmentHistory(
    serviceId: string,
    user: UserContext
) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    return await prisma.serviceAssignment.findMany({
        where: { serviceId },
        orderBy: { assignedAt: 'desc' },
    });
}

// ============================================
// SERVICE ACTIONS
// ============================================

/**
 * Start work on a service
 * ASSIGNED → IN_PROGRESS
 */
export async function startWork(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    const service = await getServiceForAction(serviceId, user, 'ASSIGNED');

    // Check if user is the current assignee or admin
    if (!canPerformAction(service, user)) {
        throw new Error('Only the assigned person or admin can start work on this service');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
            status: 'IN_PROGRESS',
            startDate: new Date(),
        },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'ASSIGNED',
        'IN_PROGRESS',
        'START_WORK',
        user,
        undefined,
        notes || 'Work started'
    );

    return updatedService;
}

/**
 * Request documents from client
 * IN_PROGRESS → WAITING_FOR_CLIENT
 */
export async function requestDocuments(
    serviceId: string,
    user: UserContext,
    data: { documentList: string[]; message?: string }
) {
    const service = await getServiceForAction(serviceId, user, 'IN_PROGRESS');

    if (!canPerformAction(service, user)) {
        throw new Error('Only the assigned person or admin can request documents');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'WAITING_FOR_CLIENT' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'IN_PROGRESS',
        'WAITING_FOR_CLIENT',
        'REQUEST_DOCUMENTS',
        user,
        undefined,
        data.message || 'Documents requested from client',
        { documentList: data.documentList }
    );

    // TODO: Send notification to client

    return updatedService;
}

/**
 * Put service on hold
 * IN_PROGRESS/WAITING_FOR_CLIENT → ON_HOLD
 */
export async function putOnHold(
    serviceId: string,
    user: UserContext,
    reason: string
) {
    const service = await prisma.service.findFirst({
        where: { id: serviceId, firmId: user.firmId },
    });

    if (!service) throw new Error('Service not found');

    if (!['IN_PROGRESS', 'WAITING_FOR_CLIENT'].includes(service.status)) {
        throw new Error(`Cannot put service on hold from ${service.status} status`);
    }

    if (!canPerformAction(service, user)) {
        throw new Error('Only the assigned person or admin can put this service on hold');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'ON_HOLD' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        service.status,
        'ON_HOLD',
        'PUT_ON_HOLD',
        user,
        reason,
        'Service put on hold'
    );

    return updatedService;
}

/**
 * Resume work on a service
 * ON_HOLD/WAITING_FOR_CLIENT/CHANGES_REQUESTED → IN_PROGRESS
 */
export async function resumeWork(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    const service = await prisma.service.findFirst({
        where: { id: serviceId, firmId: user.firmId },
    });

    if (!service) throw new Error('Service not found');

    if (!['ON_HOLD', 'WAITING_FOR_CLIENT', 'CHANGES_REQUESTED'].includes(service.status)) {
        throw new Error(`Cannot resume work from ${service.status} status`);
    }

    if (!canPerformAction(service, user)) {
        throw new Error('Only the assigned person or admin can resume work');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'IN_PROGRESS' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    const action = service.status === 'CHANGES_REQUESTED' ? 'START_FIXING' : 'RESUME_WORK';

    await logStatusChange(
        user.firmId,
        serviceId,
        service.status,
        'IN_PROGRESS',
        action,
        user,
        undefined,
        notes || 'Work resumed'
    );

    return updatedService;
}

/**
 * Submit service for review
 * IN_PROGRESS → UNDER_REVIEW
 */
export async function submitForReview(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    const service = await getServiceForAction(serviceId, user, 'IN_PROGRESS');

    if (!canPerformAction(service, user)) {
        throw new Error('Only the assigned person or admin can submit for review');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'UNDER_REVIEW' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'IN_PROGRESS',
        'UNDER_REVIEW',
        'SUBMIT_FOR_REVIEW',
        user,
        undefined,
        notes || 'Submitted for review'
    );

    // TODO: Send notification to PM/reviewer

    return updatedService;
}

/**
 * Approve work (mark complete after review)
 * UNDER_REVIEW → COMPLETED
 */
export async function approveWork(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    await getServiceForAction(serviceId, user, 'UNDER_REVIEW');

    // Only PM or higher can approve
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can approve work');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'COMPLETED' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    // Mark current assignment as completed
    await prisma.serviceAssignment.updateMany({
        where: {
            serviceId,
            status: 'ACTIVE',
        },
        data: {
            status: 'COMPLETED',
            completedAt: new Date(),
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'UNDER_REVIEW',
        'COMPLETED',
        'APPROVE',
        user,
        undefined,
        notes || 'Work approved'
    );

    return updatedService;
}

/**
 * Request changes on submitted work
 * UNDER_REVIEW → CHANGES_REQUESTED
 */
export async function requestChanges(
    serviceId: string,
    user: UserContext,
    feedback: string
) {
    await getServiceForAction(serviceId, user, 'UNDER_REVIEW');

    // Only PM or higher can request changes
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can request changes');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'CHANGES_REQUESTED' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'REQUEST_CHANGES',
        user,
        feedback,
        'Changes requested'
    );

    // TODO: Send notification to assignee

    return updatedService;
}

/**
 * Mark service as completed (for PM doing work themselves)
 * IN_PROGRESS → COMPLETED
 */
export async function markComplete(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    await getServiceForAction(serviceId, user, 'IN_PROGRESS');

    // Only PM or higher can mark complete directly
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can mark complete directly. Team Members must submit for review.');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date(),
        },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'IN_PROGRESS',
        'COMPLETED',
        'MARK_COMPLETE',
        user,
        undefined,
        notes || 'Marked as complete'
    );

    return updatedService;
}

/**
 * Deliver service to client
 * COMPLETED → DELIVERED
 */
export async function deliverToClient(
    serviceId: string,
    user: UserContext,
    deliveryNotes?: string
) {
    await getServiceForAction(serviceId, user, 'COMPLETED');

    // Only PM or higher can deliver
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can deliver to client');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'DELIVERED' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'COMPLETED',
        'DELIVERED',
        'DELIVER',
        user,
        undefined,
        deliveryNotes || 'Delivered to client'
    );

    // TODO: Send notification to client

    return updatedService;
}

/**
 * Close a service (after payment received)
 * INVOICED → CLOSED
 */
export async function closeService(
    serviceId: string,
    user: UserContext,
    notes?: string
) {
    await getServiceForAction(serviceId, user, 'INVOICED');

    // Only PM or higher can close
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can close service');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'CLOSED' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        'INVOICED',
        'CLOSED',
        'CLOSE',
        user,
        undefined,
        notes || 'Service closed'
    );

    return updatedService;
}

/**
 * Cancel a service
 * ANY (except CLOSED) → CANCELLED
 */
export async function cancelService(
    serviceId: string,
    user: UserContext,
    reason: string
) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) throw new Error('Service not found');

    if (service.status === 'CLOSED') {
        throw new Error('Cannot cancel a closed service');
    }

    if (service.status === 'CANCELLED') {
        throw new Error('Service is already cancelled');
    }

    // Only PM or higher can cancel
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can cancel service');
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { status: 'CANCELLED' },
        include: {
            client: { select: { id: true, name: true, email: true } },
        },
    });

    // Revoke any active assignments
    await prisma.serviceAssignment.updateMany({
        where: {
            serviceId,
            status: 'ACTIVE',
        },
        data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revokedBy: user.id,
            revokedReason: reason,
        },
    });

    await logStatusChange(
        user.firmId,
        serviceId,
        service.status,
        'CANCELLED',
        'CANCEL',
        user,
        reason,
        'Service cancelled'
    );

    return updatedService;
}

// ============================================
// STATUS HISTORY
// ============================================

/**
 * Get status history for a service
 */
export async function getStatusHistory(
    serviceId: string,
    user: UserContext
) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) throw new Error('Service not found');

    return await prisma.serviceStatusHistory.findMany({
        where: { serviceId },
        orderBy: { changedAt: 'desc' },
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get service for action and validate status
 */
async function getServiceForAction(
    serviceId: string,
    user: UserContext,
    expectedStatus: ServiceStatus
) {
    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            firmId: user.firmId,
        },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    if (service.status !== expectedStatus) {
        throw new Error(`Service must be in ${expectedStatus} status. Current status: ${service.status}`);
    }

    return service;
}

/**
 * Check if user can perform action on service
 */
function canPerformAction(service: any, user: UserContext): boolean {
    // SUPER_ADMIN and ADMIN can do anything
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return true;
    }

    // Current assignee can perform actions
    if (service.currentAssigneeId === user.id) {
        return true;
    }

    // PM of the service can perform actions
    if (user.role === 'PROJECT_MANAGER' && service.projectManagerId === user.id) {
        return true;
    }

    return false;
}

// ============================================
// SERVICE STATISTICS (Updated for new statuses)
// ============================================

/**
 * Get service statistics with all 12 statuses
 */
export async function getEnhancedServiceStats(
    firmId: string,
    userContext?: UserContext
) {
    const where: any = { firmId };

    if (userContext) {
        if (userContext.role === 'PROJECT_MANAGER') {
            where.OR = [
                { projectManagerId: userContext.id },
                { currentAssigneeId: userContext.id },
            ];
        } else if (userContext.role === 'TEAM_MEMBER') {
            where.currentAssigneeId = userContext.id;
        } else if (userContext.role === 'CLIENT') {
            where.clientId = userContext.id;
        }
    }

    const stats = await prisma.service.groupBy({
        by: ['status'],
        where,
        _count: true,
    });

    const result = {
        PENDING: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        WAITING_FOR_CLIENT: 0,
        ON_HOLD: 0,
        UNDER_REVIEW: 0,
        CHANGES_REQUESTED: 0,
        COMPLETED: 0,
        DELIVERED: 0,
        INVOICED: 0,
        CLOSED: 0,
        CANCELLED: 0,
    };

    stats.forEach((s) => {
        (result as Record<string, number>)[s.status] = s._count;
    });

    return {
        ...result,
        active: result.PENDING + result.ASSIGNED + result.IN_PROGRESS +
            result.WAITING_FOR_CLIENT + result.ON_HOLD + result.UNDER_REVIEW +
            result.CHANGES_REQUESTED,
        completed: result.COMPLETED + result.DELIVERED + result.INVOICED + result.CLOSED,
        total: Object.values(result).reduce((a, b) => a + b, 0) - result.CANCELLED,
    };
}



