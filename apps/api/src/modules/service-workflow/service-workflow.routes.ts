import { Router, Response } from 'express';
import {
    authenticate,
    requireProjectManager,
    requireTeamMember,
    AuthenticatedRequest
} from '../../shared/middleware/auth.middleware';
import {
    assignServiceSchema,
    delegateServiceSchema,
    startWorkSchema,
    requestDocumentsSchema,
    putOnHoldSchema,
    resumeWorkSchema,
    submitForReviewSchema,
    approveWorkSchema,
    requestChangesSchema,
    deliverToClientSchema,
    cancelServiceSchema,
    closeServiceSchema,
    createEnhancedServiceSchema,
} from './service-workflow.validation';
import * as workflowService from './service-workflow.service';

// Helper to create user context with firmId validation
const createUserContext = (req: AuthenticatedRequest) => ({
    id: req.user!.id,
    role: req.user!.role,
    firmId: req.user!.firmId || '',
    name: req.user!.name,
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// SERVICE CRUD (Enhanced)
// ============================================

/**
 * POST /api/service-workflow/services
 * Create a new service with enhanced workflow
 */
router.post(
    '/services',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const validated = createEnhancedServiceSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.createEnhancedService(user, validated);

            res.status(201).json({
                success: true,
                data: service,
                message: 'Service created successfully',
            });
        } catch (error) {
            console.error('Create service error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create service',
            });
        }
    }
);

/**
 * GET /api/service-workflow/services/:id
 * Get service with enhanced workflow data
 */
router.get(
    '/services/:id',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const user = createUserContext(req);

            const service = await workflowService.getEnhancedServiceById(id, user);

            res.status(200).json({
                success: true,
                data: service,
            });
        } catch (error) {
            console.error('Get service error:', error);
            res.status(error instanceof Error && error.message === 'Service not found' ? 404 : 400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get service',
            });
        }
    }
);

// ============================================
// SERVICE ASSIGNMENT
// ============================================

/**
 * POST /api/service-workflow/services/:id/assign
 * Assign a service to PM/TM
 */
router.post(
    '/services/:id/assign',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const user = createUserContext(req);

            if (req.body.assigneeId === 'self') {
                req.body.assigneeId = user.id;
            }

            const validated = assignServiceSchema.parse(req.body);

            const result = await workflowService.assignService(id, user, validated);

            res.status(200).json({
                success: true,
                data: result,
                message: 'Service assigned successfully',
            });
        } catch (error) {
            // Use safer logging to prevent console.error crashes with complex objects
            console.error('Assign service error message:', error instanceof Error ? error.message : String(error));
            if (error instanceof Error && error.stack) {
                console.error('Stack:', error.stack);
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to assign service',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/delegate
 * Delegate a service to another PM/TM
 */
router.post(
    '/services/:id/delegate',
    requireTeamMember, // TM can delegate
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = delegateServiceSchema.parse(req.body);
            const user = createUserContext(req);

            const result = await workflowService.delegateService(id, user, validated);

            res.status(200).json({
                success: true,
                data: result,
                message: 'Service delegated successfully',
            });
        } catch (error) {
            console.error('Delegate service error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delegate service',
            });
        }
    }
);

/**
 * GET /api/service-workflow/services/:id/assignments
 * Get assignment history
 */
router.get(
    '/services/:id/assignments',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const user = createUserContext(req);

            const assignments = await workflowService.getAssignmentHistory(id, user);

            res.status(200).json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            console.error('Get assignments error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get assignments',
            });
        }
    }
);

// ============================================
// SERVICE ACTIONS
// ============================================

/**
 * POST /api/service-workflow/services/:id/actions/start-work
 * Start work on service (ASSIGNED → IN_PROGRESS)
 */
router.post(
    '/services/:id/actions/start-work',
    requireTeamMember,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = startWorkSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.startWork(id, user, validated.notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Work started successfully',
            });
        } catch (error) {
            console.error('Start work error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start work',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/request-documents
 * Request documents from client (IN_PROGRESS → WAITING_FOR_CLIENT)
 */
router.post(
    '/services/:id/actions/request-documents',
    requireTeamMember,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = requestDocumentsSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.requestDocuments(id, user, validated);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Document request sent to client',
            });
        } catch (error) {
            console.error('Request documents error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to request documents',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/put-on-hold
 * Put service on hold (IN_PROGRESS → ON_HOLD)
 */
router.post(
    '/services/:id/actions/put-on-hold',
    requireTeamMember,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = putOnHoldSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.putOnHold(id, user, validated.reason);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Service put on hold',
            });
        } catch (error) {
            console.error('Put on hold error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to put on hold',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/resume-work
 * Resume work (ON_HOLD/WAITING_FOR_CLIENT/CHANGES_REQUESTED → IN_PROGRESS)
 */
router.post(
    '/services/:id/actions/resume-work',
    requireTeamMember,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = resumeWorkSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.resumeWork(id, user, validated.notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Work resumed',
            });
        } catch (error) {
            console.error('Resume work error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to resume work',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/submit-review
 * Submit for review (IN_PROGRESS → UNDER_REVIEW)
 */
router.post(
    '/services/:id/actions/submit-review',
    requireTeamMember,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = submitForReviewSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.submitForReview(id, user, validated.notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Submitted for review',
            });
        } catch (error) {
            console.error('Submit for review error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to submit for review',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/approve
 * Approve work (UNDER_REVIEW → COMPLETED)
 */
router.post(
    '/services/:id/actions/approve',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = approveWorkSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.approveWork(id, user, validated.notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Work approved',
            });
        } catch (error) {
            console.error('Approve work error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to approve work',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/request-changes
 * Request changes (UNDER_REVIEW → CHANGES_REQUESTED)
 */
router.post(
    '/services/:id/actions/request-changes',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = requestChangesSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.requestChanges(id, user, validated.feedback);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Changes requested',
            });
        } catch (error) {
            console.error('Request changes error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to request changes',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/mark-complete
 * Mark complete directly (IN_PROGRESS → COMPLETED, PM only)
 */
router.post(
    '/services/:id/actions/mark-complete',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const { notes } = req.body;
            const user = createUserContext(req);

            const service = await workflowService.markComplete(id, user, notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Service marked as complete',
            });
        } catch (error) {
            console.error('Mark complete error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to mark complete',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/deliver
 * Deliver to client (COMPLETED → DELIVERED)
 */
router.post(
    '/services/:id/actions/deliver',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = deliverToClientSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.deliverToClient(id, user, validated.deliveryNotes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Service delivered to client',
            });
        } catch (error) {
            console.error('Deliver error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to deliver',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/close
 * Close service (INVOICED → CLOSED)
 */
router.post(
    '/services/:id/actions/close',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = closeServiceSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.closeService(id, user, validated.notes);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Service closed',
            });
        } catch (error) {
            console.error('Close service error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to close service',
            });
        }
    }
);

/**
 * POST /api/service-workflow/services/:id/actions/cancel
 * Cancel service (ANY → CANCELLED)
 */
router.post(
    '/services/:id/actions/cancel',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const validated = cancelServiceSchema.parse(req.body);
            const user = createUserContext(req);

            const service = await workflowService.cancelService(id, user, validated.reason);

            res.status(200).json({
                success: true,
                data: service,
                message: 'Service cancelled',
            });
        } catch (error) {
            console.error('Cancel service error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to cancel service',
            });
        }
    }
);

// ============================================
// STATUS HISTORY
// ============================================

/**
 * GET /api/service-workflow/services/:id/status-history
 * Get status history for a service
 */
router.get(
    '/services/:id/status-history',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const user = createUserContext(req);

            const history = await workflowService.getStatusHistory(id, user);

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            console.error('Get status history error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get status history',
            });
        }
    }
);

// ============================================
// STATISTICS
// ============================================

/**
 * GET /api/service-workflow/stats
 * Get enhanced service statistics
 */
router.get(
    '/stats',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = createUserContext(req);

            const stats = await workflowService.getEnhancedServiceStats(req.user!.firmId, user);

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get stats',
            });
        }
    }
);

export default router;


