import { Router, Response } from 'express';
import {
  getCaDashboard,
  getCaCustomers,
  getCaCustomerById,
  createCaCustomer,
  updateCaCustomer,
  deleteCaCustomer,
  getCaServices,
  getCaDocuments,
  getCaInvoices,
  getCaProfile,
  updateCaProfile,
  getClientDocuments,
} from './project-manager.service';
import {
  createCaCustomerSchema,
  updateCaCustomerSchema,
  updateCaProfileSchema,
} from './project-manager.validation';
import { authenticate, requireProjectManager, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require Project Manager authentication
router.use(authenticate);
router.use(requireProjectManager);

// Helper to get projectManagerId from authenticated user (the user's own ID)
const getProjectManagerId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new Error('User ID not found in token');
  }
  return userId;
};

// Helper to get firmId from authenticated user
const getFirmId = (req: AuthenticatedRequest): string => {
  return req.user?.firmId || '';
};

/**
 * GET /api/project-manager/dashboard
 * Get dashboard statistics for Project Manager
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const stats = await getCaDashboard(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: stats,
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
 * GET /api/project-manager/clients
 * Get all clients managed by this Project Manager
 */
router.get('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const clients = await getCaCustomers(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch clients',
    });
  }
});

/**
 * POST /api/project-manager/clients
 * Create new client under this Project Manager
 */
router.post('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createCaCustomerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
      return;
    }

    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const client = await createCaCustomer(projectManagerId, firmId, validationResult.data);
    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Create client error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(400).json({
        success: false,
        message: 'A client with this email already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

/**
 * GET /api/project-manager/clients/:id
 * Get client by ID (must be managed by this PM)
 */
router.get('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const client = await getCaCustomerById(req.params.id, projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Client not found',
    });
  }
});

/**
 * PUT /api/project-manager/clients/:id
 * Update client (must be managed by this PM)
 */
router.put('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    const validationResult = updateCaCustomerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
      return;
    }

    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const client = await updateCaCustomer(req.params.id, projectManagerId, firmId, validationResult.data);
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

/**
 * DELETE /api/project-manager/clients/:id
 * Delete client (soft delete - must be managed by this PM)
 */
router.delete('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }

    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const result = await deleteCaCustomer(req.params.id, projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete client',
    });
  }
});

/**
 * GET /api/project-manager/services
 * Get services for clients managed by this PM
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.clientId) {
      filters.clientId = req.query.clientId;
    }

    const services = await getCaServices(projectManagerId, firmId, filters);
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch services',
    });
  }
});

/**
 * POST /api/project-manager/services
 * Create a new service for a client managed by this PM
 */
router.post('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const pmName = req.user?.name || 'Project Manager';
    const { userId, type, title, description, financialYear, assessmentYear, dueDate, feeAmount, internalNotes } = req.body;

    if (!userId || !type || !title || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'Client, service type, title, and due date are required',
      });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    // Verify the client is in this firm
    const client = await prisma.client.findFirst({
      where: {
        id: userId,
        firmId,
        deletedAt: null,
      },
    });

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Create the service with correct schema fields
    const service = await prisma.service.create({
      data: {
        firmId,
        clientId: userId,
        projectManagerId,
        type,
        title,
        description: description || null,
        financialYear: financialYear || null,
        assessmentYear: assessmentYear || null,
        dueDate: new Date(dueDate),
        feeAmount: feeAmount ? parseFloat(feeAmount) : null,
        internalNotes: internalNotes || null,
        status: 'PENDING',
        origin: 'FIRM_CREATED',
        createdBy: projectManagerId,
        createdByRole: 'PROJECT_MANAGER',
        createdByName: pmName,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create service',
    });
  }
});

/**
 * GET /api/project-manager/services/:id
 * Get a single service by ID
 */
router.get('/services/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const serviceId = req.params.id;

    if (!serviceId) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        firmId,
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
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 20,
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch service',
    });
  }
});

/**
 * GET /api/project-manager/documents
 * Get documents for clients managed by this PM
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const documents = await getCaDocuments(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch documents',
    });
  }
});

/**
 * GET /api/project-manager/client-documents
 * Get client documents grouped by client
 */
router.get('/client-documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const clientDocs = await getClientDocuments(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: clientDocs,
    });
  } catch (error) {
    console.error('Get client documents error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch client documents',
    });
  }
});

// ==========================================
// TEAM MEMBER ROUTES (for Project Manager)
// ==========================================

/**
 * GET /api/project-manager/team-members
 * Get ALL team members in the firm (PM has full access in hierarchy)
 */
router.get('/team-members', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);

    const prisma = require('../../shared/utils/prisma').default;

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        firmId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Add assigned clients count
    const teamMembersWithCount = await Promise.all(
      teamMembers.map(async (tm: any) => {
        const assignedClientsCount = await prisma.clientAssignment.count({
          where: {
            teamMemberId: tm.id,
          },
        });
        return { ...tm, assignedClientsCount };
      })
    );

    res.status(200).json({
      success: true,
      data: teamMembersWithCount,
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch team members',
    });
  }
});

/**
 * POST /api/project-manager/team-members
 * Create new team member under this PM
 */
router.post('/team-members', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;
    const bcrypt = require('bcrypt');

    // Check if email already exists
    const existingTM = await prisma.teamMember.findFirst({
      where: { email: email.toLowerCase(), firmId },
    });

    if (existingTM) {
      res.status(400).json({
        success: false,
        message: 'A Team Member with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create team member
    const tm = await prisma.teamMember.create({
      data: {
        firmId,
        createdBy: projectManagerId,
        createdByRole: 'PROJECT_MANAGER',
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team Member created successfully',
      data: tm,
    });
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create team member',
    });
  }
});

/**
 * GET /api/project-manager/team-members/:id
 * Get team member by ID
 */
router.get('/team-members/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    const tm = await prisma.teamMember.findFirst({
      where: { id, firmId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!tm) {
      res.status(404).json({
        success: false,
        message: 'Team Member not found',
      });
      return;
    }

    // Get assigned clients
    const clientAssignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });

    const assignedClients = clientAssignments.map((ca: any) => ({
      assignmentId: ca.id,
      client: ca.client,
      assignedById: ca.assignedBy,
      assignedAt: ca.createdAt,
      notes: ca.notes,
    }));

    res.status(200).json({
      success: true,
      data: { ...tm, assignedClients },
    });
  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch team member',
    });
  }
});

/**
 * DELETE /api/project-manager/team-members/:id
 * Deactivate team member
 */
router.delete('/team-members/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    // Verify the TM belongs to this firm
    const tm = await prisma.teamMember.findFirst({
      where: { id, firmId, deletedAt: null },
    });

    if (!tm) {
      res.status(404).json({
        success: false,
        message: 'Team Member not found',
      });
      return;
    }

    await prisma.teamMember.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: projectManagerId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team Member deactivated successfully',
    });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deactivate team member',
    });
  }
});

/**
 * PUT /api/project-manager/team-members/:id
 * Update team member details
 */
router.put('/team-members/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { name, phone, address } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    // Verify the TM belongs to this firm
    const tm = await prisma.teamMember.findFirst({
      where: { id, firmId, deletedAt: null },
    });

    if (!tm) {
      res.status(404).json({
        success: false,
        message: 'Team Member not found',
      });
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        name: name || tm.name,
        phone: phone || null,
        address: address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team Member updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update team member',
    });
  }
});

/**
 * POST /api/project-manager/team-members/:id/assign-clients
 * Assign clients to a team member
 */
router.post('/team-members/:id/assign-clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const projectManagerId = getProjectManagerId(req);
    const teamMemberId = req.params.id;
    const { clientIds } = req.body;

    if (!teamMemberId) {
      res.status(400).json({ success: false, message: 'Team Member ID is required' });
      return;
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      res.status(400).json({ success: false, message: 'Client IDs are required' });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    // Verify the team member exists in this firm
    const tm = await prisma.teamMember.findFirst({
      where: { id: teamMemberId, firmId, deletedAt: null },
    });

    if (!tm) {
      res.status(404).json({ success: false, message: 'Team Member not found' });
      return;
    }

    // Assign clients
    const assignments = await Promise.all(
      clientIds.map(async (clientId: string) => {
        // Check if assignment already exists
        const existing = await prisma.clientAssignment.findFirst({
          where: { clientId, teamMemberId },
        });

        if (!existing) {
          return prisma.clientAssignment.create({
            data: {
              clientId,
              teamMemberId,
              assignedBy: projectManagerId,
            },
          });
        }
        return existing;
      })
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${clientIds.length} client(s) to team member`,
      data: { assigned: assignments.length },
    });
  } catch (error) {
    console.error('Assign clients error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to assign clients',
    });
  }
});

/**
 * POST /api/project-manager/team-members/:id/unassign-clients
 * Unassign clients from a team member
 */
router.post('/team-members/:id/unassign-clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const teamMemberId = req.params.id;
    const { clientIds } = req.body;

    if (!teamMemberId) {
      res.status(400).json({ success: false, message: 'Team Member ID is required' });
      return;
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      res.status(400).json({ success: false, message: 'Client IDs are required' });
      return;
    }

    const prisma = require('../../shared/utils/prisma').default;

    // Verify the team member exists in this firm
    const tm = await prisma.teamMember.findFirst({
      where: { id: teamMemberId, firmId, deletedAt: null },
    });

    if (!tm) {
      res.status(404).json({ success: false, message: 'Team Member not found' });
      return;
    }

    // Unassign clients
    await prisma.clientAssignment.deleteMany({
      where: {
        teamMemberId,
        clientId: { in: clientIds },
      },
    });

    res.status(200).json({
      success: true,
      message: `Successfully unassigned ${clientIds.length} client(s) from team member`,
    });
  } catch (error) {
    console.error('Unassign clients error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to unassign clients',
    });
  }
});

/**
 * GET /api/project-manager/invoices
 * Get invoices for clients managed by this PM
 */
router.get('/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const invoices = await getCaInvoices(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch invoices',
    });
  }
});

/**
 * GET /api/project-manager/profile
 * Get Project Manager's own profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const profile = await getCaProfile(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Profile not found',
    });
  }
});

/**
 * PUT /api/project-manager/profile
 * Update Project Manager's own profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = updateCaProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
      return;
    }

    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const profile = await updateCaProfile(projectManagerId, firmId, validationResult.data);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile',
    });
  }
});

/**
 * POST /api/project-manager/change-password
 * Change Project Manager's password
 */
router.post('/change-password', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    // Get current PM - import prisma and bcrypt if needed
    const prisma = require('../../shared/utils/prisma').default;
    const bcrypt = require('bcrypt');

    const pm = await prisma.projectManager.findUnique({
      where: { id: projectManagerId },
    });

    if (!pm) {
      res.status(404).json({
        success: false,
        message: 'Project Manager not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, pm.password);
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.projectManager.update({
      where: { id: projectManagerId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password',
    });
  }
});

// Backward compatibility - keep /users routes as aliases for /clients
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectManagerId = getProjectManagerId(req);
    const firmId = getFirmId(req);
    const clients = await getCaCustomers(projectManagerId, firmId);
    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
});

export default router;
