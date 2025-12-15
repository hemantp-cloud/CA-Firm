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

        // Group documents by document type
        const typeMap: { [key: string]: any[] } = {};
        documents.forEach((doc: any) => {
            const type = doc.documentType || 'OTHER';
            if (!typeMap[type]) typeMap[type] = [];
            typeMap[type].push({
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            });
        });

        const documentTypes = Object.entries(typeMap).map(([type, docs]) => ({
            type,
            count: docs.length,
            documents: docs,
        }));

        // Build response structure
        const response = {
            myDocuments: {
                title: 'My Documents',
                users: documents.length > 0 ? [{
                    userId: clientId,
                    userName: clientInfo?.name || 'My Account',
                    userEmail: clientInfo?.email || req.user?.email || '',
                    documentTypes,
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

        const { documentType, description } = req.body;

        // Save file to storage in client-specific folder
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'clients', clientId);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

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
                description: description || null,
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
