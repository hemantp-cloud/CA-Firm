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
} from './admin.service';
import {
  createClientSchema,
  updateClientSchema,
  createUserSchema,
  updateUserSchema,
} from './admin.validation';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require Admin authentication
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
 * GET /api/admin/clients
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
 * POST /api/admin/clients
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
 * GET /api/admin/clients/:id
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

export default router;

