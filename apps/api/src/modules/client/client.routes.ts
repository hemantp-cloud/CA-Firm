import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  getClientDashboard,
  getClientServices,
  getClientServiceById,
  getClientDocuments,
  uploadClientDocument,
  uploadDraftDocument,
  submitDocuments,
  deleteDraftDocument,
  getClientInvoices,
  getClientInvoiceById,
  recordClientPayment,
  getClientProfile,
  updateClientProfile,
} from './client.service';
import {
  uploadClientDocumentSchema,
  recordClientPaymentSchema,
  updateClientProfileSchema,
} from './client.validation';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require CLIENT authentication and CLIENT role
router.use(authenticate);
router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'CLIENT') {
    res.status(403).json({
      success: false,
      message: 'Access denied. CLIENT role required.',
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
 * GET /api/client/dashboard
 * Get dashboard statistics for CLIENT
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const stats = await getClientDashboard(userId, firmId);

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
 * GET /api/client/services
 * Get all services for CLIENT
 */
router.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const services = await getClientServices(userId, firmId);

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
 * GET /api/client/services/:id
 * Get service by ID (must belong to client)
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
    const service = await getClientServiceById(req.params.id, userId, firmId);

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
 * GET /api/client/documents
 * Get all documents for CLIENT
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const filters: any = {};

    if (req.query.type) {
      filters.type = req.query.type;
    }

    const documents = await getClientDocuments(userId, firmId, filters);

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
 * POST /api/client/documents
 * Upload document for CLIENT
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

    const validationResult = uploadClientDocumentSchema.safeParse({
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
    const document = await uploadClientDocument(
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
 * POST /api/client/documents/draft
 * Upload document as DRAFT
 */
router.post('/documents/draft', upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'File is required',
      });
      return;
    }

    const validationResult = uploadClientDocumentSchema.safeParse({
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
    const document = await uploadDraftDocument(
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
      message: 'Document uploaded as draft successfully',
    });
  } catch (error) {
    console.error('Upload draft document error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload draft document',
    });
  }
});

/**
 * POST /api/client/documents/submit
 * Submit draft documents
 */
router.post('/documents/submit', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Document IDs array is required',
      });
      return;
    }

    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const submittedDocs = await submitDocuments(userId, firmId, documentIds);

    res.status(200).json({
      success: true,
      data: submittedDocs,
      message: 'Documents submitted successfully',
    });
  } catch (error) {
    console.error('Submit documents error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit documents',
    });
  }
});

/**
 * DELETE /api/client/documents/draft/:id
 * Delete draft document
 */
router.delete('/documents/draft/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
      return;
    }

    const userId = getUserId(req);
    const firmId = getFirmId(req);

    const result = await deleteDraftDocument(userId, firmId, id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Draft document deleted successfully',
    });
  } catch (error) {
    console.error('Delete draft document error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete draft document',
    });
  }
});

/**
 * GET /api/client/invoices
 * Get all invoices for CLIENT
 */
router.get('/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const invoices = await getClientInvoices(userId, firmId);

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
 * GET /api/client/invoices/:id
 * Get invoice by ID (must belong to client)
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
    const invoice = await getClientInvoiceById(req.params.id, userId, firmId);

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
 * GET /api/client/invoices/:id/pdf
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
    const invoice = await getClientInvoiceById(req.params.id, userId, firmId);

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
 * POST /api/client/payments
 * Record payment for invoice
 */
router.post('/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = recordClientPaymentSchema.safeParse(req.body);

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
    const payment = await recordClientPayment(
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
 * GET /api/client/profile
 * Get CLIENT's own profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const profile = await getClientProfile(userId, firmId);

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

    const userId = getUserId(req);
    const firmId = getFirmId(req);
    const profile = await updateClientProfile(userId, firmId, validationResult.data);

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

