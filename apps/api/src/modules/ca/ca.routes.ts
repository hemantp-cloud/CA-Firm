import { Router, Request, Response } from 'express';
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
} from './ca.service';
import {
  createClientSchema,
  updateClientSchema,
  createUserSchema,
  updateUserSchema,
} from './ca.validation';
import { authenticate, requireCA } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require CA authentication
router.use(authenticate);
router.use(requireCA);

// Helper to get firmId from authenticated user
const getFirmId = (req: any): string => {
  return req.user?.firmId || '';
};

/**
 * GET /api/ca/dashboard
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
 * GET /api/ca/clients
 * Get all clients
 */
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
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

/**
 * POST /api/ca/clients
 * Create new client (also creates CLIENT user)
 */
router.post('/clients', async (req: Request, res: Response): Promise<void> => {
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

    // Handle duplicate email error
    if (error.code === 'P2002' || error.message?.includes('email') || error.message?.includes('Email')) {
      // Check if it's our custom inactive client error
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

/**
 * GET /api/ca/clients/:id
 * Get client by ID with users
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
 * PUT /api/ca/clients/:id
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
 * DELETE /api/ca/clients/:id
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
 * POST /api/ca/clients/:id/reactivate
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
 * GET /api/ca/users
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
 * POST /api/ca/users
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
    const user = await createUser(firmId, validationResult.data);

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
 * GET /api/ca/users/:id
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
    const user = await getUserById(req.params.id, firmId);

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
 * PUT /api/ca/users/:id
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
    const user = await updateUser(req.params.id, firmId, validationResult.data);

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
 * DELETE /api/ca/users/:id
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
    await deleteUser(req.params.id, firmId);

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

export default router;

