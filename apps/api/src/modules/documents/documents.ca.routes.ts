import { Router } from 'express';
import prisma from '../../shared/utils/prisma';
import { authenticate, requireCA, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import multer from 'multer';
import { ensureUploadDirectories } from '../../shared/utils/file-storage';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/ca/client-documents - Get ALL client documents with hierarchical organization (for dashboard)
router.get('/client-documents', authenticate, requireCA, async (_req: AuthenticatedRequest, res) => {
    try {
        const firmId = _req.user?.firmId;

        if (!firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Fetch all submitted documents from clients
        const documents = await prisma.document.findMany({
            where: {
                firmId,
                uploadStatus: 'SUBMITTED',
                clientId: { not: null },
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                service: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        // Group by client (hierarchical structure)
        const clientMap = new Map<string, any>();

        documents.forEach(doc => {
            if (!doc.client) return;
            const clientId = doc.client.id;
            const clientName = doc.client.name;
            const docType = doc.documentType || 'OTHER';

            if (!clientMap.has(clientId)) {
                clientMap.set(clientId, {
                    clientId,
                    clientName,
                    clientEmail: doc.client.email,
                    documentTypes: {},
                });
            }

            const client = clientMap.get(clientId)!;
            if (!client.documentTypes[docType]) {
                client.documentTypes[docType] = [];
            }

            client.documentTypes[docType].push(doc);
        });

        // Convert Maps to arrays and handle BigInt serialization
        const organizedData = Array.from(clientMap.values()).map(client => ({
            clientId: client.clientId,
            clientName: client.clientName,
            clientEmail: client.clientEmail,
            documentTypes: Object.entries(client.documentTypes).map(([type, docs]) => ({
                type,
                count: (docs as any[]).length,
                documents: (docs as any[]).map(doc => ({
                    ...doc,
                    fileSize: doc.fileSize?.toString() || '0',
                })),
            })),
        }));

        return res.json({
            success: true,
            data: organizedData,
        });
    } catch (error) {
        console.error('Error fetching client documents:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch client documents',
        });
    }
});

// GET /api/ca/documents - List documents in the firm
router.get('/documents', authenticate, requireCA, async (req: AuthenticatedRequest, res) => {
    try {
        const firmId = req.user?.firmId;

        if (!firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Fetch documents in the firm (PM can see all documents)
        const documents = await prisma.document.findMany({
            where: {
                firmId,
                isDeleted: false,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                service: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        return res.json({
            success: true,
            data: documents.map(doc => ({
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            })),
        });
    } catch (error) {
        console.error('Error fetching CA documents:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
        });
    }
});

// POST /api/ca/documents/upload - Upload document
router.post('/documents/upload', authenticate, requireCA, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.userId;
        const firmId = req.user?.firmId;

        if (!userId || !firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { documentType, description, serviceId, clientId } = req.body;

        // Save file to storage
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'ca-documents');
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

        // Create document record
        const document = await prisma.document.create({
            data: {
                firmId,
                clientId: clientId || null,
                uploadedById: userId,
                uploadedByRole: 'PROJECT_MANAGER',
                serviceId: serviceId || null,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: BigInt(req.file.size),
                storagePath,
                documentType: documentType || null,
                description: description || null,
                uploadStatus: 'SUBMITTED',
                submittedAt: new Date(),
            },
            include: {
                service: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return res.json({
            success: true,
            data: {
                ...document,
                fileSize: document.fileSize?.toString() || '0',
            },
            message: 'Document uploaded successfully',
        });
    } catch (error) {
        console.error('Error uploading CA document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload document',
        });
    }
});

// GET /api/ca/documents/:id - Get single document details
router.get('/:id', authenticate, requireCA, async (req: AuthenticatedRequest, res) => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;

        if (!firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const document = await prisma.document.findFirst({
            where: { id, firmId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                service: true,
            },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }

        return res.json({
            success: true,
            data: {
                ...document,
                fileSize: document.fileSize?.toString() || '0',
            },
        });
    } catch (error) {
        console.error('Error fetching document details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch document details',
        });
    }
});

// DELETE /api/ca/documents/:id - Delete document
router.delete('/documents/:id', authenticate, requireCA, async (req: AuthenticatedRequest, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.userId;
        const firmId = req.user?.firmId;

        if (!userId || !firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const document = await prisma.document.findFirst({
            where: { id, firmId },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }

        // Soft delete
        await prisma.document.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });

        return res.json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete document',
        });
    }
});

export default router;
