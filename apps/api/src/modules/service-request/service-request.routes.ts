import { Router, Response } from 'express';
import {
    authenticate,
    requireProjectManager,
    AuthenticatedRequest
} from '../../shared/middleware/auth.middleware';
import {
    createServiceRequestSchema,
} from '../service-workflow/service-workflow.validation';
import * as requestService from './service-request.service';
import { RequestStatus, ServiceType } from '@prisma/client';

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
// SERVICE REQUEST ROUTES
// ============================================

/**
 * POST /api/service-requests
 * Create a new service request (Client only)
 */
router.post(
    '/',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (req.user!.role !== 'CLIENT') {
                res.status(403).json({
                    success: false,
                    message: 'Only clients can create service requests',
                });
                return;
            }

            const validated = createServiceRequestSchema.parse(req.body);
            const user = createUserContext(req);

            const request = await requestService.createServiceRequest(user, validated);

            res.status(201).json({
                success: true,
                data: request,
                message: 'Service request submitted successfully',
            });
        } catch (error) {
            console.error('Create service request error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create service request',
            });
        }
    }
);

/**
 * GET /api/service-requests
 * Get all service requests (filtered by role)
 */
router.get(
    '/',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = createUserContext(req);

            const filters: any = {};
            if (req.query.status) {
                filters.status = req.query.status as RequestStatus;
            }
            if (req.query.serviceType) {
                filters.serviceType = req.query.serviceType as ServiceType;
            }
            if (req.query.clientId) {
                filters.clientId = req.query.clientId as string;
            }

            const requests = await requestService.getServiceRequests(user, filters);

            res.status(200).json({
                success: true,
                data: requests,
            });
        } catch (error) {
            console.error('Get service requests error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get service requests',
            });
        }
    }
);

/**
 * GET /api/service-requests/stats
 * Get service request statistics
 */
router.get(
    '/stats',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = createUserContext(req);

            const stats = await requestService.getServiceRequestStats(user);

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

/**
 * GET /api/service-requests/:id
 * Get a single service request
 */
router.get(
    '/:id',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const user = createUserContext(req);

            const request = await requestService.getServiceRequestById(id, user);

            res.status(200).json({
                success: true,
                data: request,
            });
        } catch (error) {
            console.error('Get service request error:', error);
            res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get service request',
            });
        }
    }
);

/**
 * POST /api/service-requests/:id/approve
 * Approve a service request (PM/Admin only)
 */
router.post(
    '/:id/approve',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const { approvalNotes, quotedFee, dueDate } = req.body;
            const user = createUserContext(req);

            const result = await requestService.approveServiceRequest(id, user, {
                approvalNotes,
                quotedFee: quotedFee ? parseFloat(quotedFee) : null,
                dueDate,
            });

            res.status(200).json({
                success: true,
                data: result,
                message: 'Service request approved and service created',
            });
        } catch (error) {
            console.error('Approve request error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to approve request',
            });
        }
    }
);

/**
 * POST /api/service-requests/:id/reject
 * Reject a service request (PM/Admin only)
 */
router.post(
    '/:id/reject',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const id = req.params.id!;
            const { rejectionReason } = req.body;

            if (!rejectionReason) {
                res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
                return;
            }

            const user = createUserContext(req);

            const request = await requestService.rejectServiceRequest(id, user, rejectionReason);

            res.status(200).json({
                success: true,
                data: request,
                message: 'Service request rejected',
            });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to reject request',
            });
        }
    }
);

/**
 * POST /api/service-requests/:id/cancel
 * Cancel a service request (Client only)
 */
router.post(
    '/:id/cancel',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (req.user!.role !== 'CLIENT') {
                res.status(403).json({
                    success: false,
                    message: 'Only clients can cancel their own requests',
                });
                return;
            }

            const id = req.params.id!;
            const user = createUserContext(req);

            const request = await requestService.cancelServiceRequest(id, user);

            res.status(200).json({
                success: true,
                data: request,
                message: 'Service request cancelled',
            });
        } catch (error) {
            console.error('Cancel request error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to cancel request',
            });
        }
    }
);

export default router;
