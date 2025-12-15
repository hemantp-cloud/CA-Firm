import { Router, Response } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  markInvoiceAsSent,
  getInvoicePDFData,
} from './invoices.service';
import { generateInvoicePDF } from '../../shared/utils/pdf-generator';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from './invoices.validation';
import { authenticate, requireCA, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();

// Helper to get user context
const getUserContext = (req: AuthenticatedRequest) => {
  return {
    id: req.user?.userId || '',
    role: req.user?.role || '',
    firmId: req.user?.firmId || '',
  };
};

/**
 * GET /api/invoices
 * Get all invoices with role-based filtering
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userContext = getUserContext(req);
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.clientId) {
      filters.clientId = req.query.clientId as string;
    }

    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom as string;
    }

    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo as string;
    }

    const invoices = await getAllInvoices(userContext, filters);

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
 * POST /api/invoices
 * Create new invoice (CA only)
 */
router.post('/', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createInvoiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = req.user?.firmId;
    const creatorId = req.user?.userId;
    const creatorRole = req.user?.role;

    if (!firmId || !creatorId || !creatorRole) {
      res.status(401).json({
        success: false,
        message: 'User context not found',
      });
      return;
    }

    // Map userId to clientId for new schema
    const invoiceData: any = {
      clientId: validationResult.data.userId || validationResult.data.clientId,
      invoiceDate: validationResult.data.invoiceDate,
      dueDate: validationResult.data.dueDate,
      items: validationResult.data.items,
      discount: validationResult.data.discount,
    };

    if (validationResult.data.serviceId) {
      invoiceData.serviceId = validationResult.data.serviceId;
    }
    if (validationResult.data.notes) {
      invoiceData.notes = validationResult.data.notes;
    }

    const invoice = await createInvoice(firmId, creatorId, creatorRole, invoiceData);

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create invoice',
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID with ownership check
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
      return;
    }
    const userContext = getUserContext(req);
    const invoice = await getInvoiceById(req.params.id, userContext);

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
 * PUT /api/invoices/:id
 * Update invoice (CA only)
 */
router.put('/:id', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = updateInvoiceSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const firmId = req.user?.firmId;
    if (!firmId || !req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Firm ID or Invoice ID not found',
      });
      return;
    }
    const updateData: any = {};
    if (validationResult.data.invoiceDate) {
      updateData.invoiceDate = validationResult.data.invoiceDate;
    }
    if (validationResult.data.dueDate) {
      updateData.dueDate = validationResult.data.dueDate;
    }
    if (validationResult.data.items) {
      updateData.items = validationResult.data.items;
    }
    if (validationResult.data.discount !== undefined) {
      updateData.discount = validationResult.data.discount;
    }
    if (validationResult.data.notes !== undefined) {
      updateData.notes = validationResult.data.notes;
    }
    const invoice = await updateInvoice(req.params.id, firmId, updateData);

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update invoice',
    });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Generate and download invoice PDF
 */
router.get('/:id/pdf', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
      return;
    }
    const userContext = getUserContext(req);
    if (!userContext.firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }
    const invoice = await getInvoiceById(req.params.id, userContext);
    const pdfData = await getInvoicePDFData(req.params.id, userContext.firmId);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(pdfData as any);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate invoice PDF',
    });
  }
});

/**
 * POST /api/invoices/:id/send
 * Mark invoice as sent and send email (CA only)
 */
router.post('/:id/send', authenticate, requireCA, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required',
      });
      return;
    }
    const firmId = req.user?.firmId;
    if (!firmId) {
      res.status(401).json({
        success: false,
        message: 'Firm ID not found',
      });
      return;
    }
    const invoice = await markInvoiceAsSent(req.params.id, firmId);

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice marked as sent and email notification sent',
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send invoice',
    });
  }
});

export default router;
