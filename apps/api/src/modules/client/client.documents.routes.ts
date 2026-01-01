import { Router } from 'express';
import { authenticate, requireClient, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import multer from 'multer';
import { ensureUploadDirectories } from '../../shared/utils/file-storage';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../../shared/utils/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/client/documents/hierarchy - Get client's own documents organized by type
router.get('/documents/hierarchy', authenticate, requireClient, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Fetch client's info
        const clientInfo = await prisma.client.findFirst({
            where: { id: clientId },
            select: { id: true, name: true, email: true }
        });

        // Fetch only documents belonging to THIS client
        const documents = await prisma.document.findMany({
            where: {
                firmId,
                clientId,
                isDeleted: false,
            },
            include: {
                service: { select: { id: true, title: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });

        // NEW: Group documents by Category first, then by Document Type
        // Structure: { category: { documentType: [documents] } }
        const categoryMap: { [category: string]: { [type: string]: any[] } } = {};

        documents.forEach((doc: any) => {
            const category = doc.category || 'Uncategorized';
            const type = doc.documentType || 'OTHER';

            if (!categoryMap[category]) {
                categoryMap[category] = {};
            }
            if (!categoryMap[category][type]) {
                categoryMap[category][type] = [];
            }
            categoryMap[category][type].push({
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            });
        });

        // Convert to array structure for frontend
        const categories = Object.entries(categoryMap).map(([category, types]) => ({
            category,
            documentTypes: Object.entries(types).map(([type, docs]) => ({
                type,
                count: docs.length,
                documents: docs,
            })),
            totalFiles: Object.values(types).reduce((sum, docs) => sum + docs.length, 0),
        }));

        // Build response structure
        const response = {
            myDocuments: {
                title: 'My Documents',
                categories,  // NEW: Include category-based grouping
                users: documents.length > 0 ? [{
                    userId: clientId,
                    userName: clientInfo?.name || 'My Account',
                    userEmail: clientInfo?.email || req.user?.email || '',
                    // Keep documentTypes for backward compatibility
                    documentTypes: categories.flatMap(c => c.documentTypes),
                }] : [],
                totalFiles: documents.length,
            },
        };

        res.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error('Error fetching hierarchical documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/client/documents - List all client's documents
router.get('/documents', authenticate, requireClient, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Fetch only documents belonging to THIS client
        const documents = await prisma.document.findMany({
            where: {
                firmId,
                clientId,
                isDeleted: false,
            },
            include: {
                service: { select: { id: true, title: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });

        res.json({
            success: true,
            data: documents.map((doc: any) => ({
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            })),
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
        });
    }
});

// GET /api/client/documents/:id - Get single document details
router.get('/documents/:id', authenticate, requireClient, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                clientId, // Only own documents
            },
            include: {
                service: true,
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        res.json({
            success: true,
            data: {
                ...document,
                fileSize: (document as any).fileSize?.toString() || '0',
            },
        });
    } catch (error) {
        console.error('Error fetching document details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document details',
        });
    }
});

// DELETE /api/client/documents/:id - Soft delete document
router.delete('/documents/:id', authenticate, requireClient, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Only delete own documents
        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                clientId,
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        // Soft delete the document
        await prisma.document.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: clientId,
            },
        });

        res.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
        });
    }
});

// GET /api/client/documents/:id/download - Download document file
router.get('/documents/:id/download', authenticate, requireClient, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                clientId, // Only own documents
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        // Check if file exists - try multiple possible paths
        const fsSync = require('fs');
        let filePath = document.storagePath;
        let fileExists = fsSync.existsSync(filePath);

        if (!fileExists) {
            filePath = path.join(process.cwd(), document.storagePath);
            fileExists = fsSync.existsSync(filePath);
        }

        if (!fileExists) {
            filePath = path.join(process.cwd(), 'uploads', document.storagePath);
            fileExists = fsSync.existsSync(filePath);
        }

        if (!fileExists) {
            res.status(404).json({
                success: false,
                message: 'File not found on server',
            });
            return;
        }

        res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

        const fileStream = fsSync.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download document',
        });
    }
});

// POST /api/client/documents/upload - Upload a document
router.post('/documents/upload', authenticate, requireClient, upload.single('file'), async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const clientId = req.user?.clientId;

        if (!firmId || !clientId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        const { documentType, category, description, customName } = req.body;  // NEW: also extract category and customName

        // Save file to storage in client-specific folder
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'clients', clientId);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

        // For OTHER documents, store customName in description for auto-matching
        const documentDescription = documentType === 'OTHER' && customName
            ? customName
            : (description || null);

        // Create document record
        const document = await prisma.document.create({
            data: {
                firmId,
                clientId, // Document belongs to THIS client
                uploadedById: clientId,
                uploadedByRole: 'CLIENT',
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: BigInt(req.file.size),
                storagePath,
                documentType: documentType || 'OTHER',
                category: category || null,  // NEW: Save category
                description: documentDescription,  // Store customName for OTHER types
                status: 'PENDING',
            },
        });

        res.json({
            success: true,
            data: {
                ...document,
                fileSize: (document as any).fileSize?.toString() || '0',
            },
            message: 'Document uploaded successfully',
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
        });
    }
});

export default router;
