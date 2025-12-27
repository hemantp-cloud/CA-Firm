import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { PrismaClient, ServiceStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/services
 * Get services (placeholder - to be implemented)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement service fetching from new schema
    res.status(200).json({
      success: true,
      data: [],
      message: 'Services endpoint - to be implemented with new schema',
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
 * PATCH /api/services/:id/status
 * Update service status
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = Object.values(ServiceStatus);
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      res.status(404).json({
        success: false,
        message: 'Service not found',
      });
      return;
    }

    // Update service status
    const updatedService = await prisma.service.update({
      where: { id },
      data: { status: status as ServiceStatus },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedService,
      message: 'Service status updated successfully',
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update service status',
    });
  }
});

export default router;

