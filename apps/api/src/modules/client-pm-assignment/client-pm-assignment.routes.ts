import { Router, Response } from 'express';
import {
    authenticate,
    requireProjectManager,
    requireAdmin,
    AuthenticatedRequest
} from '../../shared/middleware/auth.middleware';
import {
    assignPMToClientSchema,
} from '../service-workflow/service-workflow.validation';
import * as assignmentService from './client-pm-assignment.service';

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
// CLIENT-PM ASSIGNMENT ROUTES
// ============================================

/**
 * GET /api/clients/:clientId/pm-assignments
 * Get all PM assignments for a client
 */
router.get(
    '/clients/:clientId/pm-assignments',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const clientId = req.params.clientId!;
            const user = createUserContext(req);

            const assignments = await assignmentService.getClientPMAssignments(clientId, user);

            res.status(200).json({
                success: true,
                data: assignments,
            });
        } catch (error) {
            console.error('Get assignments error:', error);
            res.status(error instanceof Error && error.message.includes('not found') ? 404 : 400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get assignments',
            });
        }
    }
);

/**
 * POST /api/clients/:clientId/pm-assignments
 * Assign a PM to a client
 */
router.post(
    '/clients/:clientId/pm-assignments',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const clientId = req.params.clientId!;
            const validated = assignPMToClientSchema.parse(req.body);
            const user = createUserContext(req);

            const assignment = await assignmentService.assignPMToClient(clientId, user, validated);

            res.status(201).json({
                success: true,
                data: assignment,
                message: 'PM assigned to client successfully',
            });
        } catch (error) {
            console.error('Assign PM error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to assign PM',
            });
        }
    }
);

/**
 * PATCH /api/clients/:clientId/pm-assignments/:assignmentId
 * Update a PM assignment (change role)
 */
router.patch(
    '/clients/:clientId/pm-assignments/:assignmentId',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const assignmentId = req.params.assignmentId!;
            const { role, notes } = req.body;
            const user = createUserContext(req);

            const assignment = await assignmentService.updatePMAssignment(assignmentId, user, { role, notes });

            res.status(200).json({
                success: true,
                data: assignment,
                message: 'Assignment updated successfully',
            });
        } catch (error) {
            console.error('Update assignment error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update assignment',
            });
        }
    }
);

/**
 * DELETE /api/clients/:clientId/pm-assignments/:assignmentId
 * Remove a PM assignment from a client
 */
router.delete(
    '/clients/:clientId/pm-assignments/:assignmentId',
    requireProjectManager,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const assignmentId = req.params.assignmentId!;
            const { reason } = req.body || {};
            const user = createUserContext(req);

            const assignment = await assignmentService.removePMFromClient(assignmentId, user, reason);

            res.status(200).json({
                success: true,
                data: assignment,
                message: 'PM removed from client',
            });
        } catch (error) {
            console.error('Remove PM error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to remove PM',
            });
        }
    }
);

/**
 * GET /api/clients/:clientId/pm-assignments/history
 * Get assignment history for a client (Admin only)
 */
router.get(
    '/clients/:clientId/pm-assignments/history',
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const clientId = req.params.clientId!;
            const user = createUserContext(req);

            const history = await assignmentService.getClientPMAssignmentHistory(clientId, user);

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            console.error('Get history error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get history',
            });
        }
    }
);

/**
 * GET /api/project-managers/:pmId/clients
 * Get all clients assigned to a PM
 */
router.get(
    '/project-managers/:pmId/clients',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const pmId = req.params.pmId!;
            const user = createUserContext(req);

            const clients = await assignmentService.getPMClients(pmId, user);

            res.status(200).json({
                success: true,
                data: clients,
            });
        } catch (error) {
            console.error('Get PM clients error:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get clients',
            });
        }
    }
);

export default router;

