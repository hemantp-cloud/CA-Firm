import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../shared/utils/prisma';
import {
  getDashboardStats,
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  reactivateClient,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from './admin.service';
import {
  createClientSchema,
  updateClientSchema,
  createUserSchema,
  updateUserSchema,
} from './admin.validation';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';
import { logUserDeletion } from '../../services/auditLog.service';

const router = Router();

// All routes require Admin authentication - Updated: Dec 9, 2025
router.use(authenticate);
router.use(requireAdmin);

// Helper to get firmId from authenticated user
const getFirmId = (req: any): string => {
  return req.user?.firmId || '';
};

// Helper to get userId from authenticated user
const getUserId = (req: any): string => {
  return req.user?.userId || req.user?.id || '';
};

// Helper to get userRole from authenticated user
const getUserRole = (req: any): string => {
  return req.user?.role || '';
};

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const stats = await getDashboardStats(firmId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    });
  }
});

/**
 * PUT /api/admin/profile
 * Update admin profile
 */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { name, phone } = req.body;

    const admin = await prisma.admin.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: admin,
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
 * POST /api/admin/change-password
 * Change admin password
 */
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
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

    // Get current admin
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
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
    await prisma.admin.update({
      where: { id: userId },
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

/**
 * GET /api/admin/clients
 * Get all clients
 */
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const clients = await prisma.client.findMany({
      where: { firmId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        pan: true,
        gstin: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

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
 * POST /api/admin/clients
 * Create new client
 */
router.post('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const createdBy = getUserId(req);
    const { name, email, phone, password, companyName, pan, gstin } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
      return;
    }

    // Check if email already exists
    const existingClient = await prisma.client.findFirst({
      where: { email: email.toLowerCase(), firmId },
    });

    if (existingClient) {
      res.status(400).json({
        success: false,
        message: 'A Client with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create client
    const client = await prisma.client.create({
      data: {
        firmId,
        createdBy,
        createdByRole: 'ADMIN',
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        companyName: companyName || null,
        pan: pan || null,
        gstin: gstin || null,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        pan: true,
        gstin: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error: any) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Update client
 */
router.put('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { name, phone, pan, gstin, companyName, address, city, state, pincode } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Check if client exists and belongs to firm
    const existingClient = await prisma.client.findFirst({
      where: { id, firmId, deletedAt: null },
    });

    if (!existingClient) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: name || existingClient.name,
        phone: phone !== undefined ? phone : existingClient.phone,
        pan: pan !== undefined ? pan : existingClient.pan,
        gstin: gstin !== undefined ? gstin : existingClient.gstin,
        companyName: companyName !== undefined ? companyName : existingClient.companyName,
        address: address !== undefined ? address : existingClient.address,
        city: city !== undefined ? city : existingClient.city,
        state: state !== undefined ? state : existingClient.state,
        pincode: pincode !== undefined ? pincode : existingClient.pincode,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        pan: true,
        gstin: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

/**
 * DELETE /api/admin/clients/:id
 * Deactivate client
 */
router.delete('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await prisma.client.update({
      where: { id, firmId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Client deactivated successfully',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deactivate client',
    });
  }
});

/**
 * DELETE /api/admin/clients/:id/permanent
 * Permanently delete client (hard delete)
 */
router.delete('/clients/:id/permanent', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Verify client exists and belongs to firm
    const client = await prisma.client.findFirst({
      where: { id, firmId },
    });

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    // Log the deletion before removing
    await logUserDeletion(firmId, deletedBy, 'ADMIN', id, client.name, 'CLIENT', true);

    // Permanently delete from database
    await prisma.client.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Client permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete client error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to permanently delete client',
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users by role
 */
router.get('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const client = await getClientById(req.params.id, firmId);

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Client not found',
    });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Update client
 */
router.put('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const validationResult = updateClientSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const client = await updateClient(req.params.id, firmId, validationResult.data);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client updated successfully',
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
 * DELETE /api/admin/clients/:id
 * Delete client (soft delete)
 */
router.delete('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    await deleteClient(req.params.id, firmId);

    res.status(200).json({
      success: true,
      message: 'Client deactivated successfully',
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
 * POST /api/admin/clients/:id/reactivate
 * Reactivate client
 */
router.post('/clients/:id/reactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const client = await reactivateClient(req.params.id, firmId);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reactivate client',
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.role) {
      filters.role = req.query.role as string;
    }

    if (req.query.clientId) {
      filters.clientId = req.query.clientId as string;
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const users = await getAllUsers(firmId, filters);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = createUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const creatorId = getUserId(req);
    const creatorRole = getUserRole(req);
    const user = await createUser(firmId, creatorId, creatorRole, validationResult.data);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully. Welcome email sent.',
    });
  } catch (error: any) {
    console.error('Create user error:', error);

    // Handle duplicate email error
    if (error.code === 'P2002' || error.message?.includes('email') || error.message?.includes('Email')) {
      res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user by ID with services
 */
router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const role = req.query.role as string || req.body.role;
    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Role is required to fetch user details',
      });
      return;
    }
    const user = await getUserById(req.params.id, firmId, role);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'User not found',
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const role = req.body.role;
    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Role is required to update user',
      });
      return;
    }
    const user = await updateUser(req.params.id, firmId, role, validationResult.data);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (soft delete)
 */
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const role = req.query.role as string || req.body.role;
    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Role is required to delete user',
      });
      return;
    }
    await deleteUser(req.params.id, firmId, role, deletedBy);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
});

// IMPORTANT: Make /users routes also available as /client routes
// This maintains backward compatibility while supporting the new naming convention
const clientRouter = Router();
clientRouter.use(authenticate);
clientRouter.use(requireAdmin);

// Re-use the same handlers from /users routes
clientRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.role) {
      filters.role = req.query.role as string;
    }

    if (req.query.clientId) {
      filters.clientId = req.query.clientId as string;
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const users = await getAllUsers(firmId, filters);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
});

clientRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = createUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const creatorId = getUserId(req);
    const creatorRole = getUserRole(req);
    // clientRouter handles CLIENT role users
    const userData = { ...validationResult.data, role: 'CLIENT' };
    const user = await createUser(firmId, creatorId, creatorRole, userData);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully. Welcome email sent.',
    });
  } catch (error: any) {
    console.error('Create user error:', error);

    if (error.code === 'P2002' || error.message?.includes('email') || error.message?.includes('Email')) {
      res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

clientRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    // clientRouter handles CLIENT role users
    const user = await getUserById(req.params.id, firmId, 'CLIENT');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'User not found',
    });
  }
});

clientRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    // clientRouter handles CLIENT role users
    const user = await updateUser(req.params.id, firmId, 'CLIENT', validationResult.data);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
});

clientRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    // clientRouter handles CLIENT role users
    await deleteUser(req.params.id, firmId, 'CLIENT', deletedBy);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
});

// Mount the client router
router.use('/client', clientRouter);

// IMPORTANT: Also mount /clients routes as /ca for clearer terminology
// Frontend calls /admin/ca for CA partner management
// This uses the same handlers as /clients
const caRouter = Router();
caRouter.use(authenticate);
caRouter.use(requireAdmin);

// Re-use all client handlers for CA routes
caRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const clients = await getAllClients(firmId);

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

caRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = createClientSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const client = await createClient(firmId, validationResult.data);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully. Welcome email sent.',
    });
  } catch (error: any) {
    console.error('Create client error:', error);

    if (error.code === 'P2002' || error.message?.includes('email') || error.message?.includes('Email')) {
      if (error.code === 'INACTIVE_CLIENT_EXISTS') {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code,
          existingClientId: error.existingClientId,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

caRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const client = await getClientById(req.params.id, firmId);

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Client not found',
    });
  }
});

caRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const validationResult = updateClientSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = getFirmId(req);
    const client = await updateClient(req.params.id, firmId, validationResult.data);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

caRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    await deleteClient(req.params.id, firmId);

    res.status(200).json({
      success: true,
      message: 'Client deactivated successfully',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete client',
    });
  }
});

caRouter.post('/:id/reactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Client ID is required',
      });
      return;
    }
    const firmId = getFirmId(req);
    const client = await reactivateClient(req.params.id, firmId);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate client error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reactivate client',
    });
  }
});

// Mount the CA router
router.use('/ca', caRouter);

// ============================================
// PROJECT MANAGER ROUTES (for Admin)
// ============================================

/**
 * GET /api/admin/project-managers
 * Get all project managers
 */
router.get('/project-managers', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const projectManagers = await prisma.projectManager.findMany({
      where: { firmId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pan: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: projectManagers,
    });
  } catch (error) {
    console.error('Get project managers error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch project managers',
    });
  }
});

/**
 * POST /api/admin/project-managers
 * Create a new project manager
 */
router.post('/project-managers', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const createdBy = getUserId(req);
    const { name, email, phone, pan, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
      return;
    }

    // Check if email already exists
    const existingPM = await prisma.projectManager.findFirst({
      where: { email: email.toLowerCase(), firmId },
    });

    if (existingPM) {
      res.status(400).json({
        success: false,
        message: 'A Project Manager with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create project manager
    const pm = await prisma.projectManager.create({
      data: {
        firmId,
        createdBy,
        createdByRole: 'ADMIN',
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        pan: pan || null,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pan: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project Manager created successfully',
      data: pm,
    });
  } catch (error) {
    console.error('Create project manager error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create project manager',
    });
  }
});

/**
 * GET /api/admin/project-managers/:id
 * Get project manager by ID
 */
router.get('/project-managers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    const pm = await prisma.projectManager.findFirst({
      where: { id: id, firmId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pan: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!pm) {
      res.status(404).json({
        success: false,
        message: 'Project Manager not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: pm,
    });
  } catch (error) {
    console.error('Get project manager error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch project manager',
    });
  }
});

/**
 * PUT /api/admin/project-managers/:id
 * Update project manager
 */
router.put('/project-managers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { name, phone, pan } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Check if PM exists and belongs to firm
    const existingPm = await prisma.projectManager.findFirst({
      where: { id, firmId, deletedAt: null },
    });

    if (!existingPm) {
      res.status(404).json({
        success: false,
        message: 'Project Manager not found',
      });
      return;
    }

    const pm = await prisma.projectManager.update({
      where: { id },
      data: {
        name: name || existingPm.name,
        phone: phone !== undefined ? phone : existingPm.phone,
        pan: pan !== undefined ? pan : existingPm.pan,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pan: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project Manager updated successfully',
      data: pm,
    });
  } catch (error) {
    console.error('Update project manager error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update project manager',
    });
  }
});

/**
 * DELETE /api/admin/project-managers/:id
 * Deactivate project manager
 */
router.delete('/project-managers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await prisma.projectManager.update({
      where: { id, firmId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project Manager deactivated successfully',
    });
  } catch (error) {
    console.error('Delete project manager error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deactivate project manager',
    });
  }
});

/**
 * DELETE /api/admin/project-managers/:id/permanent
 * Permanently delete project manager (hard delete)
 */
router.delete('/project-managers/:id/permanent', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Verify PM exists and belongs to firm
    const pm = await prisma.projectManager.findFirst({
      where: { id, firmId },
    });

    if (!pm) {
      res.status(404).json({
        success: false,
        message: 'Project Manager not found',
      });
      return;
    }

    // Log the deletion before removing
    await logUserDeletion(firmId, deletedBy, 'ADMIN', id, pm.name, 'PROJECT_MANAGER', true);

    // Permanently delete from database
    await prisma.projectManager.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Project Manager permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete project manager error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to permanently delete project manager',
    });
  }
});

// ============================================
// TEAM MEMBER ROUTES (for Admin)
// ============================================

/**
 * GET /api/admin/team-members
 * Get all team members
 */
router.get('/team-members', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const teamMembers = await prisma.teamMember.findMany({
      where: { firmId, deletedAt: null },
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

    res.status(200).json({
      success: true,
      data: teamMembers,
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
 * POST /api/admin/team-members
 * Create a new team member
 */
router.post('/team-members', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const createdBy = getUserId(req);
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
      return;
    }

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
        createdBy,
        createdByRole: 'ADMIN',
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
 * GET /api/admin/team-members/:id
 * Get team member by ID
 */
router.get('/team-members/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    const tm = await prisma.teamMember.findFirst({
      where: { id: id, firmId, deletedAt: null },
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
 * PUT /api/admin/team-members/:id
 * Update team member
 */
router.put('/team-members/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { name, phone } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Check if TM exists and belongs to firm
    const existingTm = await prisma.teamMember.findFirst({
      where: { id, firmId, deletedAt: null },
    });

    if (!existingTm) {
      res.status(404).json({
        success: false,
        message: 'Team Member not found',
      });
      return;
    }

    const tm = await prisma.teamMember.update({
      where: { id },
      data: {
        name: name || existingTm.name,
        phone: phone !== undefined ? phone : existingTm.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Team Member updated successfully',
      data: tm,
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
 * DELETE /api/admin/team-members/:id
 * Deactivate team member
 */
router.delete('/team-members/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    await prisma.teamMember.update({
      where: { id, firmId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy,
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
 * DELETE /api/admin/team-members/:id/permanent
 * Permanently delete team member (hard delete)
 */
router.delete('/team-members/:id/permanent', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const deletedBy = getUserId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID is required' });
      return;
    }

    // Verify TM exists and belongs to firm
    const tm = await prisma.teamMember.findFirst({
      where: { id, firmId },
    });

    if (!tm) {
      res.status(404).json({
        success: false,
        message: 'Team Member not found',
      });
      return;
    }

    // Log the deletion before removing
    await logUserDeletion(firmId, deletedBy, 'ADMIN', id, tm.name, 'TEAM_MEMBER', true);

    // Permanently delete from database
    await prisma.teamMember.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Team Member permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete team member error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to permanently delete team member',
    });
  }
});

/**
 * POST /api/admin/team-members/:id/assign-clients
 * Assign clients to a team member
 */
router.post('/team-members/:id/assign-clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const assignedById = getUserId(req);
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
              assignedBy: assignedById,
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
 * POST /api/admin/team-members/:id/unassign-clients
 * Unassign clients from a team member
 */
router.post('/team-members/:id/unassign-clients', async (req: Request, res: Response): Promise<void> => {
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

// ============================================
// SERVICES ROUTES (for Admin)
// ============================================

/**
 * GET /api/admin/services
 * Get all services with optional filters
 */
router.get('/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);

    // Build filter conditions
    const where: any = { firmId };

    if (req.query.clientId) {
      where.clientId = req.query.clientId as string;
    }
    if (req.query.type) {
      where.type = req.query.type as string;
    }
    if (req.query.status) {
      where.status = req.query.status as string;
    }
    if (req.query.dateFrom || req.query.dateTo) {
      where.dueDate = {};
      if (req.query.dateFrom) {
        where.dueDate.gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        where.dueDate.lte = new Date(req.query.dateTo as string);
      }
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map the response to include user/client in expected format
    const mappedServices = services.map((service) => ({
      id: service.id,
      title: service.title,
      type: service.type,
      status: service.status,
      dueDate: service.dueDate,
      feeAmount: service.feeAmount ? Number(service.feeAmount) : null,
      description: service.description,
      notes: service.notes,
      createdAt: service.createdAt,
      user: {
        id: service.client.id,
        name: service.client.name,
      },
      client: {
        id: service.client.id,
        name: service.client.companyName || service.client.name,
      },
      projectManager: service.projectManager,
    }));

    res.status(200).json({
      success: true,
      data: mappedServices,
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
 * POST /api/admin/services
 * Create a new service
 */
router.post('/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const { clientId, type, title, description, dueDate, feeAmount, notes, projectManagerId } = req.body;

    if (!clientId || !type || !title || !dueDate) {
      res.status(400).json({
        success: false,
        message: 'Client, type, title, and due date are required',
      });
      return;
    }

    const service = await prisma.service.create({
      data: {
        firmId,
        clientId,
        projectManagerId: projectManagerId || null,
        type,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        feeAmount: feeAmount ? parseFloat(feeAmount) : null,
        notes: notes || null,
        status: 'PENDING',
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
 * GET /api/admin/services/:id
 * Get single service by ID
 */
router.get('/services/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }

    const service = await prisma.service.findFirst({
      where: { id, firmId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
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
        tasks: true,
        documents: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            uploadedAt: true,
            status: true,
          },
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
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch service',
    });
  }
});

/**
 * PATCH /api/admin/services/:id/status
 * Update service status
 */
router.patch('/services/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { status } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const service = await prisma.service.update({
      where: { id, firmId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Service status updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service status',
    });
  }
});

/**
 * PUT /api/admin/services/:id
 * Update service details
 */
router.put('/services/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;
    const { title, description, type, dueDate, feeAmount, notes, projectManagerId, status } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (feeAmount !== undefined) updateData.feeAmount = feeAmount ? parseFloat(feeAmount) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (projectManagerId !== undefined) updateData.projectManagerId = projectManagerId || null;
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    const service = await prisma.service.update({
      where: { id, firmId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service',
    });
  }
});

/**
 * DELETE /api/admin/services/:id
 * Delete a service
 */
router.delete('/services/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = getFirmId(req);
    const id = req.params.id;

    if (!id) {
      res.status(400).json({ success: false, message: 'Service ID is required' });
      return;
    }

    await prisma.service.delete({
      where: { id, firmId },
    });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete service',
    });
  }
});

export default router;



