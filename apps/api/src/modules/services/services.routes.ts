import { Router, Response } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
  getServicesByStatus,
} from './services.service';
import {
  createServiceSchema,
  updateServiceSchema,
  updateServiceStatusSchema,
} from './services.validation';
import { authenticate, requireCA, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// Helper to get user context from request
const getUserContext = (req: AuthenticatedRequest) => {
  return {
    id: req.user?.userId || '',
    role: req.user?.role || '',
    firmId: req.user?.firmId || '',
    clientId: req.user?.clientId || null,
  };
};

/**
 * GET /api/services
 * Get all services with role-based filtering
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userContext = getUserContext(req);

    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.clientId) filters.clientId = req.query.clientId as string;
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom as string;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo as string;

    const services = await getAllServices(userContext, filters);

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get services',
    });
  }
});

/**
 * GET /api/services/kanban
 * Get services grouped by status for Kanban view
 */
router.get('/kanban', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userContext = getUserContext(req);
    const groupedServices = await getServicesByStatus(userContext);

    res.status(200).json({
      success: true,
      data: groupedServices,
    });
  } catch (error) {
    console.error('Get services by status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get services by status',
    });
  }
});

/**
 * GET /api/services/:id
 * Get single service by id with ownership check
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }

    const userContext = getUserContext(req);
    const service = await getServiceById(id, userContext);

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Service not found',
    });
  }
});

/**
 * POST /api/services
 * Create new service (CA only)
 */
router.post('/', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createServiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = req.user?.firmId || '';
    const service = await createService(firmId, validationResult.data);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully',
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
 * PUT /api/services/:id
 * Update service (CA only)
 */
router.put('/:id', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }

    const validationResult = updateServiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = req.user?.firmId || '';
    const service = await updateService(id, firmId, validationResult.data);

    res.status(200).json({
      success: true,
      data: service,
      message: 'Service updated successfully',
    });
  } catch (error) {
    console.error('Update service error:', error);

    if (error instanceof Error && error.message === 'Service not found') {
      res.status(404).json({
        success: false,
        message: 'Service not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service',
    });
  }
});

/**
 * PATCH /api/services/:id/status
 * Update service status only (CA only)
 */
router.patch('/:id/status', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }

    const validationResult = updateServiceStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = req.user?.firmId || '';
    const userId = req.user?.userId || '';
    const service = await updateServiceStatus(id, firmId, validationResult.data.status, userId);

    res.status(200).json({
      success: true,
      data: service,
      message: 'Service status updated successfully',
    });
  } catch (error) {
    console.error('Update service status error:', error);

    if (error instanceof Error && error.message === 'Service not found') {
      res.status(404).json({
        success: false,
        message: 'Service not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service status',
    });
  }
});

/**
 * DELETE /api/services/:id
 * Delete service (soft delete - CA only)
 */
router.delete('/:id', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }

    const firmId = req.user?.firmId || '';
    await deleteService(id, firmId);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete service error:', error);

    if (error instanceof Error && error.message === 'Service not found') {
      res.status(404).json({
        success: false,
        message: 'Service not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete service',
    });
  }
});

export default router;
