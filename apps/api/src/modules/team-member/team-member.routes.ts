import { Router, Response } from 'express';
import { z } from 'zod';
import {
    listTrainees,
    getTraineeById,
    createTrainee,
    updateTrainee,
    softDeleteTrainee,
    permanentDeleteTrainee,
    assignClientsToTrainee,
    unassignClientsFromTrainee,
    getAssignedClients,
    getTraineesForClient,
    getTeamMemberDashboard,
} from './team-member.service';
import { authenticate, requireAdminOrCA, requireAdmin, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

// Validation Schemas
const createTeamMemberSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
    password: z.string().optional(),
    mustChangePassword: z.boolean().optional().default(true),
    twoFactorEnabled: z.boolean().optional().default(false),
});

const updateTeamMemberSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    pan: z.string().optional(),
    aadhar: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
});

const assignClientsSchema = z.object({
    clientIds: z.array(z.string().uuid()).min(1),
    notes: z.string().optional(),
});

const unassignClientsSchema = z.object({
    clientIds: z.array(z.string().uuid()).min(1),
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Helper to get firmId from authenticated user
const getFirmId = (req: AuthenticatedRequest): string => {
    return req.user?.firmId || '';
};

// Helper to get userId from authenticated user
const getUserId = (req: AuthenticatedRequest): string => {
    return req.user?.userId || '';
};

// Helper to get user role from authenticated user
const getUserRole = (req: AuthenticatedRequest): string => {
    return req.user?.role || '';
};

/**
 * GET /api/team-member/dashboard
 * Get dashboard for team member (own dashboard)
 * Accessible by: TEAM_MEMBER
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const teamMemberId = getUserId(req);
        const firmId = getFirmId(req);
        const dashboard = await getTeamMemberDashboard(teamMemberId, firmId);

        res.status(200).json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch dashboard',
        });
    }
});

/**
 * GET /api/team-member/clients
 * Get all clients assigned to the current team member (for their own dashboard)
 * Accessible by: TEAM_MEMBER
 * NOTE: This MUST be defined before /:id route
 */
router.get('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const teamMemberId = getUserId(req);
        const firmId = getFirmId(req);
        const clients = await getAssignedClients(teamMemberId, firmId);

        res.status(200).json({
            success: true,
            data: clients,
        });
    } catch (error) {
        console.error('Get my clients error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch clients',
        });
    }
});

/**
 * GET /api/team-member/assigned-clients
 * Alias for /clients - Get all clients assigned to the current team member
 * Accessible by: TEAM_MEMBER
 */
router.get('/assigned-clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const teamMemberId = getUserId(req);
        const firmId = getFirmId(req);
        const clients = await getAssignedClients(teamMemberId, firmId);

        res.status(200).json({
            success: true,
            data: clients,
        });
    } catch (error) {
        console.error('Get assigned clients error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch assigned clients',
        });
    }
});

/**
 * GET /api/team-member/services
 * Get all services for clients assigned to the current team member
 * Accessible by: TEAM_MEMBER
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const teamMemberId = getUserId(req);
        const firmId = getFirmId(req);

        const prisma = require('../../shared/utils/prisma').default;

        // Get clients assigned to this team member
        const clientAssignments = await prisma.clientAssignment.findMany({
            where: { teamMemberId },
            select: { clientId: true },
        });

        const clientIds = clientAssignments.map((ca: any) => ca.clientId);

        // Get services for those clients
        const services = await prisma.service.findMany({
            where: {
                firmId,
                clientId: { in: clientIds },
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
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
        console.error('Get my services error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch services',
        });
    }
});

/**
 * GET /api/team-member
 * List all team members in the firm
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.get('/', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = getFirmId(req);
        const filters: any = {};

        if (req.query.isActive !== undefined) {
            filters.isActive = req.query.isActive === 'true';
        }

        const teamMembers = await listTrainees(firmId, filters);

        res.status(200).json({
            success: true,
            data: teamMembers,
        });
    } catch (error) {
        console.error('List team members error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch team members',
        });
    }
});

/**
 * POST /api/team-member
 * Create a new team member
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.post('/', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const validationResult = createTeamMemberSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationResult.error.errors,
            });
            return;
        }

        const firmId = getFirmId(req);
        const createdBy = getUserId(req);
        const createdByRole = getUserRole(req);
        const data = validationResult.data;
        const teamMember = await createTrainee(firmId, {
            ...data,
            phone: data.phone ?? null,
            address: data.address ?? null,
        }, createdBy, createdByRole);

        res.status(201).json({
            success: true,
            data: teamMember,
            message: 'Team member created successfully. Welcome email sent.',
        });
    } catch (error: any) {
        console.error('Create team member error:', error);

        if (error.code === 'P2002' || error.message?.includes('email') || error.message?.includes('Email')) {
            res.status(400).json({
                success: false,
                message: 'Email already exists',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create team member',
        });
    }
});

/**
 * GET /api/team-member/:id
 * Get a specific team member by ID with assigned clients
 * Accessible by: ADMIN, PROJECT_MANAGER, TEAM_MEMBER (self)
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const firmId = getFirmId(req);
        const userRole = getUserRole(req);
        const userId = getUserId(req);

        // If team member is viewing their own profile, allow it
        // Otherwise, require ADMIN or PROJECT_MANAGER role
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'PROJECT_MANAGER' && userId !== req.params.id) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
            });
            return;
        }

        const teamMember = await getTraineeById(req.params.id, firmId);

        res.status(200).json({
            success: true,
            data: teamMember,
        });
    } catch (error) {
        console.error('Get team member error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Team member not found',
        });
    }
});

/**
 * PUT /api/team-member/:id
 * Update a team member's details
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.put('/:id', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const validationResult = updateTeamMemberSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationResult.error.errors,
            });
            return;
        }

        const firmId = getFirmId(req);
        const data = validationResult.data;
        const teamMember = await updateTrainee(req.params.id, firmId, {
            name: data.name ?? null,
            phone: data.phone ?? null,
            address: data.address ?? null,
            isActive: data.isActive,
            twoFactorEnabled: data.twoFactorEnabled,
        });

        res.status(200).json({
            success: true,
            data: teamMember,
            message: 'Team member updated successfully',
        });
    } catch (error) {
        console.error('Update team member error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update team member',
        });
    }
});

/**
 * DELETE /api/team-member/:id
 * Soft delete (deactivate) a team member
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.delete('/:id', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const firmId = getFirmId(req);
        const deletedBy = getUserId(req);
        const result = await softDeleteTrainee(req.params.id, firmId, deletedBy);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Delete team member error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete team member',
        });
    }
});

/**
 * DELETE /api/team-member/:id/permanent
 * Permanently delete a team member (hard delete)
 * Accessible by: ADMIN, SUPER_ADMIN ONLY
 */
router.delete('/:id/permanent', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const firmId = getFirmId(req);
        const result = await permanentDeleteTrainee(req.params.id, firmId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error('Permanent delete team member error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to permanently delete team member',
        });
    }
});

/**
 * POST /api/team-member/:id/assign-clients
 * Assign clients to a team member
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.post('/:id/assign-clients', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const validationResult = assignClientsSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationResult.error.errors,
            });
            return;
        }

        const firmId = getFirmId(req);
        const assignedBy = getUserId(req);
        const data = validationResult.data;
        const result = await assignClientsToTrainee(req.params.id, firmId, {
            clientIds: data.clientIds,
            notes: data.notes ?? null,
        }, assignedBy);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                assignedCount: result.assignedCount,
            },
        });
    } catch (error) {
        console.error('Assign clients error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to assign clients',
        });
    }
});

/**
 * POST /api/team-member/:id/unassign-clients
 * Unassign clients from a team member
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.post('/:id/unassign-clients', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const validationResult = unassignClientsSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationResult.error.errors,
            });
            return;
        }

        const firmId = getFirmId(req);
        const result = await unassignClientsFromTrainee(req.params.id, firmId, validationResult.data);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                unassignedCount: result.unassignedCount,
            },
        });
    } catch (error) {
        console.error('Unassign clients error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to unassign clients',
        });
    }
});

/**
 * GET /api/team-member/:id/assigned-clients
 * Get all clients assigned to a team member
 * Accessible by: ADMIN, PROJECT_MANAGER, TEAM_MEMBER (self)
 */
router.get('/:id/assigned-clients', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                success: false,
                message: 'Team member ID is required',
            });
            return;
        }

        const firmId = getFirmId(req);
        const userRole = getUserRole(req);
        const userId = getUserId(req);

        // If team member is viewing their own clients, allow it
        // Otherwise, require ADMIN or PROJECT_MANAGER role
        if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'PROJECT_MANAGER' && userId !== req.params.id) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
            });
            return;
        }

        const clients = await getAssignedClients(req.params.id, firmId);

        res.status(200).json({
            success: true,
            data: clients,
        });
    } catch (error) {
        console.error('Get assigned clients error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch assigned clients',
        });
    }
});


/**
 * GET /api/team-member/client/:clientId/team-members
 * Get all team members assigned to a specific client
 * Accessible by: ADMIN, PROJECT_MANAGER, SUPER_ADMIN
 */
router.get('/client/:clientId/team-members', requireAdminOrCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.clientId) {
            res.status(400).json({
                success: false,
                message: 'Client ID is required',
            });
            return;
        }

        const firmId = getFirmId(req);
        const teamMembers = await getTraineesForClient(req.params.clientId, firmId);

        res.status(200).json({
            success: true,
            data: teamMembers,
        });
    } catch (error) {
        console.error('Get team members for client error:', error);
        res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch team members for client',
        });
    }
});

export default router;
