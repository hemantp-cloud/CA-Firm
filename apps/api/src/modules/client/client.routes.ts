import { Router, Response } from 'express';
import {
  getClientDashboard,
  getClientUsers,
  getClientUserById,
  createClientUser,
  updateClientUser,
  deleteClientUser,
  getClientServices,
  getClientDocuments,
  getClientInvoices,
  getClientProfile,
  updateClientProfile,
} from './client.service';
import {
  createClientUserSchema,
  updateClientUserSchema,
  updateClientProfileSchema,
} from './client.validation';
import { authenticate, requireClient, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require CLIENT authentication
router.use(authenticate);
router.use(requireClient);

// Helper to get clientId from authenticated user
const getClientId = (req: AuthenticatedRequest): string => {
  const clientId = req.user?.clientId;
  if (!clientId) {
    throw new Error('Client ID not found in token');
  }
  return clientId;
};

// Helper to get firmId from authenticated user
const getFirmId = (req: AuthenticatedRequest): string => {
  return req.user?.firmId || '';
};

/**
 * GET /api/client/dashboard
 * Get dashboard statistics for CLIENT
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const stats = await getClientDashboard(clientId, firmId);

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
 * GET /api/client/users
 * Get all users for this CLIENT
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const users = await getClientUsers(clientId, firmId);

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
 * POST /api/client/users
 * Create new user under this CLIENT
 */
router.post('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createClientUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const user = await createClientUser(clientId, firmId, validationResult.data);

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

/**
 * GET /api/client/users/:id
 * Get user by ID (must belong to this CLIENT)
 */
router.get('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const user = await getClientUserById(req.params.id, clientId, firmId);

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
 * PUT /api/client/users/:id
 * Update user (must belong to this CLIENT)
 */
router.put('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const validationResult = updateClientUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const user = await updateClientUser(req.params.id, clientId, firmId, validationResult.data);

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
 * DELETE /api/client/users/:id
 * Delete user (soft delete - must belong to this CLIENT)
 */
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    await deleteClientUser(req.params.id, clientId, firmId);

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

/**
 * GET /api/client/services
 * Get services for CLIENT's users
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    const services = await getClientServices(clientId, firmId, filters);

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
 * GET /api/client/documents
 * Get documents for CLIENT's users
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const documents = await getClientDocuments(clientId, firmId);

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
 * GET /api/client/invoices
 * Get invoices for CLIENT's users
 */
router.get('/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const invoices = await getClientInvoices(clientId, firmId);

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
 * GET /api/client/profile
 * Get CLIENT's own profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const profile = await getClientProfile(clientId, firmId);

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
 * PUT /api/client/profile
 * Update CLIENT's own profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = updateClientProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const profile = await updateClientProfile(clientId, firmId, validationResult.data);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile',
    });
  }
});

export default router;

