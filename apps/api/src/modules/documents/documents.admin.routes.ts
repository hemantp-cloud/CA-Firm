import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import multer from 'multer';
import { ensureUploadDirectories } from '../../shared/utils/file-storage';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/admin/client-documents - Get ALL client documents with hierarchical organization (for dashboard)
router.get('/client-documents', authenticate, requireAdmin, async (_req: AuthenticatedRequest, res) => {
    try {
        // Fetch all submitted documents from CLIENT users only
        const documents = await prisma.document.findMany({
            where: {
                uploadStatus: 'SUBMITTED',
                user: {
                    role: Role.CLIENT,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
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
            const clientId = doc.user.id;
            const clientName = doc.user.name;
            const docType = doc.documentType || 'OTHER';

            if (!clientMap.has(clientId)) {
                clientMap.set(clientId, {
                    clientId,
                    clientName,
                    clientEmail: doc.user.email,
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
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch client documents',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/admin/documents - List Admin's personal documents only
router.get('/documents', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Fetch only Admin's own documents
        const documents = await prisma.document.findMany({
            where: {
                userId,
                user: {
                    role: Role.ADMIN,
                },
            },
            include: {
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
        console.error('Error fetching admin documents:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
        });
    }
});

// POST /api/admin/documents/upload - Upload Admin's personal document
router.post('/documents/upload', authenticate, requireAdmin, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.userId;
        const firmId = req.user?.firmId;

        if (!userId || !firmId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { documentType, description, serviceId } = req.body;

        // Save file to storage
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'admin-documents');
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

        // Create document record
        const document = await prisma.document.create({
            data: {
                firmId,
                userId,
                serviceId: serviceId || null,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: BigInt(req.file.size),
                storagePath,
                documentType: documentType || null,
                description: description || null,
                uploadStatus: 'SUBMITTED', // Admin documents are immediately submitted
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
        console.error('Error uploading admin document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload document',
        });
    }
});

// GET /api/admin/documents/:id - Get single document details
router.get('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const id = String(req.params.id);

        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
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
            data: document,
        });
    } catch (error) {
        console.error('Error fetching document details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch document details',
        });
    }
});

// DELETE /api/admin/documents/:id - Delete Admin's personal document
router.delete('/documents/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.userId;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }

        // Ensure document belongs to this admin
        if (document.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this document',
            });
        }

        await prisma.document.delete({
            where: { id },
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
