import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  getUserDashboard,
  getUserServices,
  getUserServiceById,
  getUserDocuments,
  uploadUserDocument,
  getUserInvoices,
  getUserInvoiceById,
  recordPayment,
  getUserProfile,
  updateUserProfile,
} from './user.service';
import {
  uploadDocumentSchema,
  recordPaymentSchema,
  updateUserProfileSchema,
} from './user.validation';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require USER authentication and USER role
router.use(authenticate);
router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'USER') {
    res.status(403).json({
      success: false,
      message: 'Access denied. USER role required.',
    });
    return;
  }

  next();
});

// Helper to get userId from authenticated user
const getUserId = (req: AuthenticatedRequest): string => {
  return req.user?.userId || '';
};

// Helper to get firmId from authenticated user
const getFirmId = (req: AuthenticatedRequest): string => {
  return req.user?.firmId || '';
};

/**
 * GET /api/user/dashboard
 * Get dashboard statistics for USER
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const stats = await getUserDashboard(userId, firmId);

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
 * GET /api/user/services
 * Get all services for USER
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const services = await getUserServices(userId, firmId);

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
 * GET /api/user/services/:id
 * Get service by ID (must belong to user)
 */
router.get('/services/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
      return;
    }
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const service = await getUserServiceById(req.params.id, userId, firmId);

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
 * GET /api/user/documents
 * Get all documents for USER
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.type) {
      filters.type = req.query.type;
    }

    const documents = await getUserDocuments(userId, firmId, filters);

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
 * POST /api/user/documents
 * Upload document for USER
 */
router.post('/documents', upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'File is required',
      });
      return;
    }

    const validationResult = uploadDocumentSchema.safeParse({
      documentType: req.body.documentType,
      serviceId: req.body.serviceId,
      description: req.body.description,
    });

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const document = await uploadUserDocument(
      userId,
      firmId,
      req.file as Express.Multer.File,
      validationResult.data.documentType as string,
      (validationResult.data.serviceId as string | undefined) || null,
      (validationResult.data.description as string | undefined) || null
    );

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload document',
    });
  }
});

/**
 * GET /api/user/invoices
 * Get all invoices for USER
 */
router.get('/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const invoices = await getUserInvoices(userId, firmId);

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
 * GET /api/user/invoices/:id
 * Get invoice by ID (must belong to user)
 */
router.get('/invoices/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
      return;
    }
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const invoice = await getUserInvoiceById(req.params.id, userId, firmId);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invoice not found',
    });
  }
});

/**
 * GET /api/user/invoices/:id/pdf
 * Download invoice PDF
 */
router.get('/invoices/:id/pdf', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
      return;
    }
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const invoice = await getUserInvoiceById(req.params.id, userId, firmId);

    // TODO: Generate PDF using pdf-generator utility
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'PDF generation not implemented yet',
      data: { invoiceId: invoice.id },
    });
  } catch (error) {
    console.error('Get invoice PDF error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Invoice not found',
    });
  }
});

/**
 * POST /api/user/payments
 * Record payment for invoice
 */
router.post('/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = recordPaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const payment = await recordPayment(
      validationResult.data.invoiceId,
      userId,
      firmId,
      validationResult.data.amount,
      validationResult.data.paymentMethod
    );

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record payment',
    });
  }
});

/**
 * GET /api/user/profile
 * Get USER's own profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const profile = await getUserProfile(userId, firmId);

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
 * PUT /api/user/profile
 * Update USER's own profile
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = updateUserProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const profile = await updateUserProfile(userId, firmId, validationResult.data);

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

