// Service Workflow API Functions
import api from '@/lib/api';
import {
    EnhancedService,
    ServiceRequest,
    ServiceStatusHistory,
    ServiceAssignment,
    ServiceType,
    RequestUrgency
} from '@/types/service-workflow';

// ============================================
// SERVICE WORKFLOW APIs
// ============================================

/**
 * Create a new enhanced service
 */
export async function createService(data: {
    clientId: string;
    type: ServiceType;
    title: string;
    description?: string;
    financialYear?: string;
    assessmentYear?: string;
    dueDate?: string;
    feeAmount?: number;
    notes?: string;
    internalNotes?: string;
    assignToId?: string;
    assignToType?: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
}) {
    const response = await api.post('/service-workflow/services', data);
    return response.data;
}

/**
 * Get enhanced service by ID
 */
export async function getEnhancedService(serviceId: string): Promise<{ success: boolean; data: EnhancedService }> {
    const response = await api.get(`/service-workflow/services/${serviceId}`);
    return response.data;
}

/**
 * Assign a service to PM/TM
 */
export async function assignService(
    serviceId: string,
    data: {
        assigneeId: string;
        assigneeType: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
        notes?: string;
    }
) {
    const response = await api.post(`/service-workflow/services/${serviceId}/assign`, data);
    return response.data;
}

/**
 * Delegate a service
 */
export async function delegateService(
    serviceId: string,
    data: {
        assigneeId: string;
        assigneeType: 'PROJECT_MANAGER' | 'TEAM_MEMBER';
        delegationReason?: string;
    }
) {
    const response = await api.post(`/service-workflow/services/${serviceId}/delegate`, data);
    return response.data;
}

/**
 * Get assignment history
 */
export async function getAssignmentHistory(serviceId: string): Promise<{ success: boolean; data: ServiceAssignment[] }> {
    const response = await api.get(`/service-workflow/services/${serviceId}/assignments`);
    return response.data;
}

/**
 * Get status history
 */
export async function getStatusHistory(serviceId: string): Promise<{ success: boolean; data: ServiceStatusHistory[] }> {
    const response = await api.get(`/service-workflow/services/${serviceId}/status-history`);
    return response.data;
}

/**
 * Get enhanced service stats
 */
export async function getServiceStats() {
    const response = await api.get('/service-workflow/stats');
    return response.data;
}

// ============================================
// SERVICE ACTIONS
// ============================================

/**
 * Start work on a service
 */
export async function startWork(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/start-work`, { notes });
    return response.data;
}

/**
 * Request documents from client
 */
export async function requestDocuments(
    serviceId: string,
    data: { documentList: string[]; message?: string }
) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/request-documents`, data);
    return response.data;
}

/**
 * Put service on hold
 */
export async function putOnHold(serviceId: string, reason: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/put-on-hold`, { reason });
    return response.data;
}

/**
 * Resume work on a service
 */
export async function resumeWork(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/resume-work`, { notes });
    return response.data;
}

/**
 * Submit service for review
 */
export async function submitForReview(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/submit-review`, { notes });
    return response.data;
}

/**
 * Approve work
 */
export async function approveWork(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/approve`, { notes });
    return response.data;
}

/**
 * Request changes
 */
export async function requestChanges(serviceId: string, feedback: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/request-changes`, { feedback });
    return response.data;
}

/**
 * Mark complete (PM only)
 */
export async function markComplete(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/mark-complete`, { notes });
    return response.data;
}

/**
 * Deliver to client
 */
export async function deliverToClient(serviceId: string, deliveryNotes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/deliver`, { deliveryNotes });
    return response.data;
}

/**
 * Close service
 */
export async function closeService(serviceId: string, notes?: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/close`, { notes });
    return response.data;
}

/**
 * Cancel service
 */
export async function cancelService(serviceId: string, reason: string) {
    const response = await api.post(`/service-workflow/services/${serviceId}/actions/cancel`, { reason });
    return response.data;
}

// ============================================
// SERVICE REQUEST APIs
// ============================================

/**
 * Create a service request (Client)
 */
export async function createServiceRequest(data: {
    serviceType: ServiceType;
    title: string;
    description?: string;
    urgency?: RequestUrgency;
    preferredDueDate?: string;
    financialYear?: string;
    assessmentYear?: string;
}) {
    const response = await api.post('/service-requests', data);
    return response.data;
}

/**
 * Get service requests
 */
export async function getServiceRequests(filters?: {
    status?: string;
    serviceType?: string;
    clientId?: string;
}): Promise<{ success: boolean; data: ServiceRequest[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.serviceType) params.append('serviceType', filters.serviceType);
    if (filters?.clientId) params.append('clientId', filters.clientId);

    const response = await api.get(`/service-requests?${params.toString()}`);
    return response.data;
}

/**
 * Get single service request
 */
export async function getServiceRequest(requestId: string): Promise<{ success: boolean; data: ServiceRequest }> {
    const response = await api.get(`/service-requests/${requestId}`);
    return response.data;
}

/**
 * Get service request stats
 */
export async function getServiceRequestStats() {
    const response = await api.get('/service-requests/stats');
    return response.data;
}

/**
 * Approve service request
 */
export async function approveServiceRequest(
    requestId: string,
    data: {
        approvalNotes?: string;
        quotedFee?: number;
        dueDate?: string;
    }
) {
    const response = await api.post(`/service-requests/${requestId}/approve`, data);
    return response.data;
}

/**
 * Reject service request
 */
export async function rejectServiceRequest(requestId: string, rejectionReason: string) {
    const response = await api.post(`/service-requests/${requestId}/reject`, { rejectionReason });
    return response.data;
}

/**
 * Cancel service request (Client)
 */
export async function cancelServiceRequest(requestId: string) {
    const response = await api.post(`/service-requests/${requestId}/cancel`);
    return response.data;
}

// ============================================
// CLIENT-PM ASSIGNMENT APIs
// ============================================

/**
 * Get PM assignments for a client
 */
export async function getClientPMAssignments(clientId: string) {
    const response = await api.get(`/clients/${clientId}/pm-assignments`);
    return response.data;
}

/**
 * Assign PM to client
 */
export async function assignPMToClient(
    clientId: string,
    data: {
        projectManagerId: string;
        role?: string;
        notes?: string;
    }
) {
    const response = await api.post(`/clients/${clientId}/pm-assignments`, data);
    return response.data;
}

/**
 * Update PM assignment
 */
export async function updatePMAssignment(
    clientId: string,
    assignmentId: string,
    data: { role?: string; notes?: string }
) {
    const response = await api.patch(`/clients/${clientId}/pm-assignments/${assignmentId}`, data);
    return response.data;
}

/**
 * Remove PM from client
 */
export async function removePMFromClient(clientId: string, assignmentId: string, reason?: string) {
    const response = await api.delete(`/clients/${clientId}/pm-assignments/${assignmentId}`, { data: { reason } });
    return response.data;
}

/**
 * Get PM's clients
 */
export async function getPMClients(pmId: string) {
    const response = await api.get(`/project-managers/${pmId}/clients`);
    return response.data;
}
