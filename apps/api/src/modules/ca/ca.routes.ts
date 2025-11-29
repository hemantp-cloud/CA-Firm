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
} from './ca.service';
import {
  createCaCustomerSchema,
  updateCaCustomerSchema,
  updateCaProfileSchema,
} from './ca.validation';
import { authenticate, requireCA, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require CA authentication
router.use(authenticate);
router.use(requireCA);

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
 * GET /api/ca/dashboard
 * Get dashboard statistics for CA
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const stats = await getCaDashboard(clientId, firmId);

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
 * GET /api/ca/users
 * Get all users for this CA
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const users = await getCaCustomers(clientId, firmId);

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
 * Create new user under this CA
 */
router.post('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createCaCustomerSchema.safeParse(req.body);

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
    const user = await createCaCustomer(clientId, firmId, validationResult.data);

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
 * GET /api/ca/users/:id
 * Get user by ID (must belong to this CA)
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
    const user = await getCaCustomerById(req.params.id, clientId, firmId);

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
 * Update user (must belong to this CA)
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
    const validationResult = updateCaCustomerSchema.safeParse(req.body);

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
    const user = await updateCaCustomer(req.params.id, clientId, firmId, validationResult.data);

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
 * Delete user (soft delete - must belong to this CA)
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
    await deleteCaCustomer(req.params.id, clientId, firmId);

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
 * GET /api/ca/services
 * Get services for CA's users
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

    const services = await getCaServices(clientId, firmId, filters);

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
 * GET /api/ca/documents
 * Get documents for CA's users
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const documents = await getCaDocuments(clientId, firmId);

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
 * GET /api/ca/invoices
 * Get invoices for CA's users
 */
router.get('/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const invoices = await getCaInvoices(clientId, firmId);

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
 * GET /api/ca/profile
 * Get CA's own profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const profile = await getCaProfile(clientId, firmId);

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
 * PUT /api/ca/profile
 * Update CA's own profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = updateCaProfileSchema.safeParse(req.body);

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
    const profile = await updateCaProfile(clientId, firmId, validationResult.data);

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

// IMPORTANT: Make /users routes also available as /clients routes
// Frontend uses /ca/clients terminology for better clarity
router.get('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const firmId = getFirmId(req);
    const users = await getCaCustomers(clientId, firmId);

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

router.post('/clients', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createCaCustomerSchema.safeParse(req.body);

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
    const user = await createCaCustomer(clientId, firmId, validationResult.data);

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

router.get('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const user = await getCaCustomerById(req.params.id, clientId, firmId);

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

router.put('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
      return;
    }
    const validationResult = updateCaCustomerSchema.safeParse(req.body);

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
    const user = await updateCaCustomer(req.params.id, clientId, firmId, validationResult.data);

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

router.delete('/clients/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    await deleteCaCustomer(req.params.id, clientId, firmId);

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

