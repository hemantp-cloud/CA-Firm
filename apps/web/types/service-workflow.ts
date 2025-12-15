// Enhanced Service Workflow Types

// Service Status - All 12 statuses
export type ServiceStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_FOR_CLIENT'
    | 'ON_HOLD'
    | 'UNDER_REVIEW'
    | 'CHANGES_REQUESTED'
    | 'COMPLETED'
    | 'DELIVERED'
    | 'INVOICED'
    | 'CLOSED'
    | 'CANCELLED';

// Service Origin
export type ServiceOrigin =
    | 'CLIENT_REQUEST'
    | 'FIRM_CREATED'
    | 'RECURRING'
    | 'COMPLIANCE';

// Request Status
export type RequestStatus =
    | 'PENDING'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CONVERTED';

// Request Urgency
export type RequestUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Service Type
export type ServiceType =
    | 'ITR_FILING'
    | 'GST_REGISTRATION'
    | 'GST_RETURN'
    | 'TDS_RETURN'
    | 'TDS_COMPLIANCE'
    | 'ROC_FILING'
    | 'AUDIT'
    | 'BOOK_KEEPING'
    | 'PAYROLL'
    | 'CONSULTATION'
    | 'OTHER';

// Enhanced Service
export interface EnhancedService {
    id: string;
    firmId: string;
    clientId: string;
    projectManagerId: string | null;
    title: string;
    description: string | null;
    type: ServiceType;
    status: ServiceStatus;
    dueDate: string | null;
    completedAt: string | null;
    feeAmount: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    // Enhanced fields
    origin: ServiceOrigin;
    serviceRequestId: string | null;
    financialYear: string | null;
    assessmentYear: string | null;
    currentAssigneeId: string | null;
    currentAssigneeType: string | null;
    currentAssigneeName: string | null;
    createdBy: string | null;
    createdByRole: string | null;
    createdByName: string | null;
    startDate: string | null;
    internalNotes: string | null;

    // Relations
    client?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    projectManager?: {
        id: string;
        name: string;
        email: string;
    };
    assignments?: ServiceAssignment[];
    statusHistory?: ServiceStatusHistory[];
    serviceRequest?: ServiceRequest | null;
}

// Service Assignment
export interface ServiceAssignment {
    id: string;
    firmId: string;
    serviceId: string;
    assigneeId: string;
    assigneeType: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
    assigneeName: string;
    assignedBy: string;
    assignedByType: string;
    assignedByName: string;
    delegationLevel: number;
    previousAssignmentId: string | null;
    delegationReason: string | null;
    assignmentType: 'INITIAL' | 'DELEGATION' | 'RE_ASSIGNMENT' | 'TAKE_BACK';
    status: 'ACTIVE' | 'DELEGATED' | 'COMPLETED' | 'REVOKED';
    assignedAt: string;
    acceptedAt: string | null;
    completedAt: string | null;
    revokedAt: string | null;
    revokedBy: string | null;
    revokedReason: string | null;
}

// Service Status History
export interface ServiceStatusHistory {
    id: string;
    firmId: string;
    serviceId: string;
    fromStatus: ServiceStatus | null;
    toStatus: ServiceStatus;
    action: string;
    changedBy: string;
    changedByType: string;
    changedByName: string;
    reason: string | null;
    notes: string | null;
    metadata: any;
    changedAt: string;
}

// Service Request
export interface ServiceRequest {
    id: string;
    firmId: string;
    clientId: string;
    serviceType: ServiceType;
    title: string;
    description: string | null;
    urgency: RequestUrgency;
    preferredDueDate: string | null;
    financialYear: string | null;
    assessmentYear: string | null;
    status: RequestStatus;
    reviewedBy: string | null;
    reviewedByRole: string | null;
    reviewedByName: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    approvalNotes: string | null;
    quotedFee: number | null;
    createdAt: string;
    updatedAt: string;
    client?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    attachments?: RequestAttachment[];
    convertedToService?: {
        id: string;
        title: string;
        status: ServiceStatus;
    } | null;
}

// Request Attachment
export interface RequestAttachment {
    id: string;
    requestId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
    uploadedAt: string;
}

// Status Configuration for UI
export interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
    phase: 'creation' | 'assignment' | 'execution' | 'review' | 'completion' | 'billing' | 'final';
}

export const STATUS_CONFIG: Record<ServiceStatus, StatusConfig> = {
    PENDING: {
        label: 'Pending',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        icon: 'Clock',
        description: 'Service created, awaiting assignment',
        phase: 'creation',
    },
    ASSIGNED: {
        label: 'Assigned',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: 'UserCheck',
        description: 'Assigned to team member, work not started',
        phase: 'assignment',
    },
    IN_PROGRESS: {
        label: 'In Progress',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        icon: 'Loader2',
        description: 'Work is actively being done',
        phase: 'execution',
    },
    WAITING_FOR_CLIENT: {
        label: 'Waiting for Client',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: 'UserMinus',
        description: 'Waiting for client input or documents',
        phase: 'execution',
    },
    ON_HOLD: {
        label: 'On Hold',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: 'Pause',
        description: 'Work temporarily paused',
        phase: 'execution',
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        icon: 'Search',
        description: 'Submitted for quality check',
        phase: 'review',
    },
    CHANGES_REQUESTED: {
        label: 'Changes Requested',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        icon: 'AlertTriangle',
        description: 'Reviewer found issues, needs rework',
        phase: 'review',
    },
    COMPLETED: {
        label: 'Completed',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: 'CheckCircle',
        description: 'All work done and approved',
        phase: 'completion',
    },
    DELIVERED: {
        label: 'Delivered',
        color: 'text-teal-600',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        icon: 'Send',
        description: 'Sent to client',
        phase: 'completion',
    },
    INVOICED: {
        label: 'Invoiced',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        icon: 'Receipt',
        description: 'Invoice generated',
        phase: 'billing',
    },
    CLOSED: {
        label: 'Closed',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: 'CheckCircle2',
        description: 'Fully completed and paid',
        phase: 'final',
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: 'XCircle',
        description: 'Service cancelled',
        phase: 'final',
    },
};

// Service Type Labels
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
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

// Urgency Labels
export const URGENCY_LABELS: Record<RequestUrgency, { label: string; color: string }> = {
    LOW: { label: 'Low', color: 'text-gray-500' },
    NORMAL: { label: 'Normal', color: 'text-blue-500' },
    HIGH: { label: 'High', color: 'text-orange-500' },
    URGENT: { label: 'Urgent', color: 'text-red-500' },
};

// Actions available per status based on role
export interface ActionConfig {
    action: string;
    label: string;
    icon: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    requiresInput?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    confirmMessage?: string;
}

export function getAvailableActions(
    status: ServiceStatus,
    role: string,
    isAssignee: boolean
): ActionConfig[] {
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(role);
    const isPM = role === 'PROJECT_MANAGER' || isAdmin;
    const canWork = isAssignee || isAdmin;

    const actions: ActionConfig[] = [];

    switch (status) {
        case 'PENDING':
            if (isPM) {
                actions.push({
                    action: 'assign',
                    label: 'Assign',
                    icon: 'UserPlus',
                    variant: 'default',
                });
            }
            break;

        case 'ASSIGNED':
            if (canWork) {
                actions.push({
                    action: 'start-work',
                    label: 'Start Work',
                    icon: 'Play',
                    variant: 'default',
                });
                actions.push({
                    action: 'delegate',
                    label: 'Delegate',
                    icon: 'Share2',
                    variant: 'outline',
                });
            }
            break;

        case 'IN_PROGRESS':
            if (canWork) {
                actions.push({
                    action: 'request-documents',
                    label: 'Request Documents',
                    icon: 'FileQuestion',
                    variant: 'outline',
                    requiresInput: true,
                    inputLabel: 'Documents needed',
                    inputPlaceholder: 'Enter documents required...',
                });
                actions.push({
                    action: 'put-on-hold',
                    label: 'Put On Hold',
                    icon: 'Pause',
                    variant: 'outline',
                    requiresInput: true,
                    inputLabel: 'Reason',
                    inputPlaceholder: 'Why are you putting this on hold?',
                });
                if (role === 'TEAM_MEMBER') {
                    actions.push({
                        action: 'submit-review',
                        label: 'Submit for Review',
                        icon: 'Send',
                        variant: 'default',
                    });
                }
                if (isPM) {
                    actions.push({
                        action: 'mark-complete',
                        label: 'Mark Complete',
                        icon: 'Check',
                        variant: 'default',
                    });
                }
                actions.push({
                    action: 'delegate',
                    label: 'Delegate',
                    icon: 'Share2',
                    variant: 'outline',
                });
            }
            break;

        case 'WAITING_FOR_CLIENT':
            if (canWork) {
                actions.push({
                    action: 'resume-work',
                    label: 'Resume Work',
                    icon: 'Play',
                    variant: 'default',
                });
                actions.push({
                    action: 'put-on-hold',
                    label: 'Put On Hold',
                    icon: 'Pause',
                    variant: 'outline',
                    requiresInput: true,
                    inputLabel: 'Reason',
                    inputPlaceholder: 'Why are you putting this on hold?',
                });
            }
            break;

        case 'ON_HOLD':
            if (canWork) {
                actions.push({
                    action: 'resume-work',
                    label: 'Resume Work',
                    icon: 'Play',
                    variant: 'default',
                });
            }
            break;

        case 'UNDER_REVIEW':
            if (isPM) {
                actions.push({
                    action: 'approve',
                    label: 'Approve',
                    icon: 'CheckCircle',
                    variant: 'default',
                });
                actions.push({
                    action: 'request-changes',
                    label: 'Request Changes',
                    icon: 'Edit',
                    variant: 'outline',
                    requiresInput: true,
                    inputLabel: 'Feedback',
                    inputPlaceholder: 'Describe what needs to be changed...',
                });
            }
            break;

        case 'CHANGES_REQUESTED':
            if (canWork) {
                actions.push({
                    action: 'resume-work',
                    label: 'Start Fixing',
                    icon: 'Play',
                    variant: 'default',
                });
            }
            break;

        case 'COMPLETED':
            if (isPM) {
                actions.push({
                    action: 'deliver',
                    label: 'Deliver to Client',
                    icon: 'Send',
                    variant: 'default',
                });
            }
            break;

        case 'DELIVERED':
            // Invoice generation happens separately
            break;

        case 'INVOICED':
            if (isPM) {
                actions.push({
                    action: 'close',
                    label: 'Close Service',
                    icon: 'CheckCircle2',
                    variant: 'default',
                });
            }
            break;
    }

    // Cancel is always available (except for closed/cancelled)
    if (!['CLOSED', 'CANCELLED'].includes(status) && isPM) {
        actions.push({
            action: 'cancel',
            label: 'Cancel',
            icon: 'X',
            variant: 'destructive',
            requiresInput: true,
            inputLabel: 'Reason',
            inputPlaceholder: 'Why is this service being cancelled?',
            confirmMessage: 'Are you sure you want to cancel this service? This action cannot be undone.',
        });
    }

    return actions;
}
