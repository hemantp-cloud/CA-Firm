import { Router, Response } from 'express';
import multer from 'multer';
import {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  downloadDocument,
  hideDocument,
} from './documents.service';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG files are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// All routes require authentication
router.use(authenticate);

// Helper to get user context
const getUserContext = (req: AuthenticatedRequest) => {
  return {
    id: req.user?.userId || '',
    role: req.user?.role || '',
    firmId: req.user?.firmId || '',
    clientId: req.user?.clientId || null,
  };
};

const uploadDocumentSchema = z.object({
  documentType: z.string().min(1, 'Document type is required'),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  description: z.string().optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
});

/**
 * POST /api/documents/upload
 * Upload a document
 */
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const validationResult = uploadDocumentSchema.safeParse({
      documentType: req.body.documentType,
      serviceId: req.body.serviceId,
      description: req.body.description,
      userId: req.body.userId,
    });

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors,
      });
      return;
    }

    const userContext = getUserContext(req);
    if (!validationResult.data.documentType) {
      res.status(400).json({
        success: false,
        message: 'Document type is required',
      });
      return;
    }
    const uploadData: {
      documentType: string;
      serviceId?: string;
      description?: string;
      userId?: string;
    } = {
      documentType: validationResult.data.documentType,
    };
    if (validationResult.data.serviceId) {
      uploadData.serviceId = validationResult.data.serviceId;
    }
    if (validationResult.data.description) {
      uploadData.description = validationResult.data.description;
    }
    if (validationResult.data.userId) {
      uploadData.userId = validationResult.data.userId;
    }
    const document = await uploadDocument(userContext, req.file, uploadData);

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
 * GET /api/documents
 * Get all documents with role-based filtering
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userContext = getUserContext(req);
    const filters: any = {};

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }

    if (req.query.serviceId) {
      filters.serviceId = req.query.serviceId as string;
    }

    if (req.query.type) {
      filters.type = req.query.type as string;
    }

    const documents = await getAllDocuments(userContext, filters);

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
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
      return;
    }
    const userContext = getUserContext(req);
    const document = await getDocumentById(req.params.id, userContext);

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Document not found',
    });
  }
});

/**
 * GET /api/documents/:id/download
 * Download document file
 */
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
      return;
    }
    const userContext = getUserContext(req);
    const fileInfo = await downloadDocument(req.params.id, userContext);

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);

    const fs = require('fs');
    const fileStream = fs.createReadStream(fileInfo.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Document not found',
    });
  }
});

/**
 * PUT /api/documents/:id/status
 * Update document status
 */
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
      return;
    }

    const { status } = req.body;
    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required',
      });
      return;
    }

    const userContext = getUserContext(req);

    // Only Admin and CA can update status
    if (userContext.role !== 'ADMIN' && userContext.role !== 'CA') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized to update status',
      });
      return;
    }

    const { updateDocumentStatus } = require('./documents.service');
    const document = await updateDocumentStatus(req.params.id, status, userContext);

    res.status(200).json({
      success: true,
      data: document,
      message: 'Document status updated successfully',
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update status',
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Hide document from current user's portal
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
      return;
    }
    const userContext = getUserContext(req);
    await hideDocument(req.params.id, userContext);

    res.status(200).json({
      success: true,
      message: 'Document hidden from your portal',
    });
  } catch (error) {
    console.error('Hide document error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to hide document',
    });
  }
});

export default router;
