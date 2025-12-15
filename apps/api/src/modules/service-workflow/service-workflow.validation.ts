import { z } from 'zod';
import { ServiceType, ServiceStatus, RequestUrgency } from '@prisma/client';

// ============================================
// SERVICE REQUEST VALIDATION
// ============================================

export const createServiceRequestSchema = z.object({
    serviceType: z.nativeEnum(ServiceType, {
        errorMap: () => ({ message: 'Invalid service type' }),
    }),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    urgency: z.nativeEnum(RequestUrgency).optional().default('NORMAL'),
    preferredDueDate: z.string().optional(),
    financialYear: z.string().optional(),
    assessmentYear: z.string().optional(),
});

export const reviewServiceRequestSchema = z.object({
    action: z.enum(['APPROVE', 'REJECT'], {
        errorMap: () => ({ message: 'Action must be APPROVE or REJECT' }),
    }),
    rejectionReason: z.string().optional(),
    approvalNotes: z.string().optional(),
    quotedFee: z.union([z.number(), z.string()]).optional().transform((val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        }
        return val || null;
    }),
    dueDate: z.string().optional(),
});

// ============================================
// SERVICE ASSIGNMENT VALIDATION
// ============================================

export const assignServiceSchema = z.object({
    assigneeId: z.string().uuid('Invalid assignee ID'),
    assigneeType: z.enum(['PROJECT_MANAGER', 'TEAM_MEMBER'], {
        errorMap: () => ({ message: 'Assignee type must be PROJECT_MANAGER or TEAM_MEMBER' }),
    }),
    notes: z.string().optional(),
});

export const delegateServiceSchema = z.object({
    assigneeId: z.string().uuid('Invalid assignee ID'),
    assigneeType: z.enum(['PROJECT_MANAGER', 'TEAM_MEMBER'], {
        errorMap: () => ({ message: 'Assignee type must be PROJECT_MANAGER or TEAM_MEMBER' }),
    }),
    delegationReason: z.string().optional(),
});

// ============================================
// SERVICE ACTION VALIDATION
// ============================================

export const startWorkSchema = z.object({
    notes: z.string().optional(),
});

export const requestDocumentsSchema = z.object({
    documentList: z.array(z.string()).min(1, 'At least one document must be specified'),
    message: z.string().optional(),
});

export const putOnHoldSchema = z.object({
    reason: z.string().min(1, 'Reason is required when putting on hold'),
});

export const resumeWorkSchema = z.object({
    notes: z.string().optional(),
});

export const submitForReviewSchema = z.object({
    notes: z.string().optional(),
});

export const approveWorkSchema = z.object({
    notes: z.string().optional(),
});

export const requestChangesSchema = z.object({
    feedback: z.string().min(1, 'Feedback is required when requesting changes'),
});

export const deliverToClientSchema = z.object({
    deliveryNotes: z.string().optional(),
    // deliverableIds: z.array(z.string().uuid()).optional(), // IDs of documents to deliver
});

export const cancelServiceSchema = z.object({
    reason: z.string().min(1, 'Reason is required when cancelling service'),
});

export const closeServiceSchema = z.object({
    notes: z.string().optional(),
});

// ============================================
// CLIENT-PM ASSIGNMENT VALIDATION
// ============================================

export const assignPMToClientSchema = z.object({
    projectManagerId: z.string().uuid('Invalid Project Manager ID'),
    role: z.enum(['PRIMARY', 'GST_HANDLER', 'ITR_HANDLER', 'AUDIT_HANDLER', 'GENERAL']).optional().default('GENERAL'),
    notes: z.string().optional(),
});

export const removePMFromClientSchema = z.object({
    reason: z.string().optional(),
});

// ============================================
// ENHANCED SERVICE CREATE VALIDATION
// ============================================

export const createEnhancedServiceSchema = z.object({
    clientId: z.string().uuid('Invalid client ID'),
    type: z.nativeEnum(ServiceType, {
        errorMap: () => ({ message: 'Invalid service type' }),
    }),
    title: z.string().min(1, 'Service title is required'),
    description: z.string().optional(),
    financialYear: z.string().optional(),
    assessmentYear: z.string().optional(),
    dueDate: z.string().optional(),
    feeAmount: z.union([z.number(), z.string()]).optional().transform((val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        }
        return val || null;
    }),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    // Auto-assign options
    assignToId: z.string().uuid().optional(),
    assignToType: z.enum(['PROJECT_MANAGER', 'TEAM_MEMBER']).optional(),
});

// ============================================
// STATUS TRANSITION VALIDATION
// ============================================

// Define valid status transitions
export const validStatusTransitions: Record<ServiceStatus, ServiceStatus[]> = {
    PENDING: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
    IN_PROGRESS: ['WAITING_FOR_CLIENT', 'ON_HOLD', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'],
    WAITING_FOR_CLIENT: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'CANCELLED'],
    UNDER_REVIEW: ['CHANGES_REQUESTED', 'COMPLETED', 'CANCELLED'],
    CHANGES_REQUESTED: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['INVOICED', 'CANCELLED'],
    INVOICED: ['CLOSED', 'CANCELLED'],
    CLOSED: [], // Final status - no transitions allowed
    CANCELLED: [], // Final status - no transitions allowed
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: ServiceStatus, to: ServiceStatus): boolean {
    return validStatusTransitions[from]?.includes(to) ?? false;
}
