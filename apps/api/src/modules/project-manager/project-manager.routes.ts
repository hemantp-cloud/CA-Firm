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
