import { Router } from 'express';
import { authenticate, requireProjectManager, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import multer from 'multer';
import { ensureUploadDirectories } from '../../shared/utils/file-storage';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../../shared/utils/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/project-manager/documents/hierarchy - Get ALL documents organized by role hierarchy
router.get('/documents/hierarchy', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const pmId = req.user?.userId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Fetch PM's info
        const pmInfo = pmId ? await prisma.projectManager.findFirst({
            where: { id: pmId },
            select: { id: true, name: true, email: true }
        }) : null;

        // Fetch all data in parallel
        const [teamMembers, clients, allDocuments] = await Promise.all([
            // Get team members in firm
            prisma.teamMember.findMany({
                where: { firmId, deletedAt: null },
                select: { id: true, name: true, email: true }
            }),
            // Get clients in firm
            prisma.client.findMany({
                where: { firmId, deletedAt: null },
                select: { id: true, name: true, email: true }
            }),
            // Get all documents
            prisma.document.findMany({
                where: { firmId, isDeleted: false },
                include: {
                    client: { select: { id: true, name: true, email: true } },
                    teamMember: { select: { id: true, name: true, email: true } },
                    service: { select: { id: true, title: true } },
                },
                orderBy: { uploadedAt: 'desc' },
            }),
        ]);

        // Create lookup maps for users
        const tmMap = new Map(teamMembers.map(tm => [tm.id, tm]));
        const clientMap = new Map(clients.map(c => [c.id, c]));

        // Structure for each role section
        const roleDocuments = {
            self: [] as any[],        // PM's own documents
            teamMembers: new Map<string, any[]>(),
            clients: new Map<string, any[]>(),
        };

        // Process each document
        allDocuments.forEach((doc: any) => {
            const docData = {
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            };

            // Check if this is a self-document (uploaded by PM)
            if (doc.uploadedByRole === 'PROJECT_MANAGER' && doc.uploadedById === pmId) {
                roleDocuments.self.push(docData);
            }
            // If document has teamMemberId, it was uploaded by a Team Member
            else if (doc.teamMemberId && tmMap.has(doc.teamMemberId)) {
                if (!roleDocuments.teamMembers.has(doc.teamMemberId)) {
                    roleDocuments.teamMembers.set(doc.teamMemberId, []);
                }
                roleDocuments.teamMembers.get(doc.teamMemberId)!.push(docData);
            }
            // If document has clientId, add to clients section
            else if (doc.clientId && clientMap.has(doc.clientId)) {
                if (!roleDocuments.clients.has(doc.clientId)) {
                    roleDocuments.clients.set(doc.clientId, []);
                }
                roleDocuments.clients.get(doc.clientId)!.push(docData);
            }
            // Default - show in clients if has client relation
            else if (doc.client) {
                if (!roleDocuments.clients.has(doc.client.id)) {
                    roleDocuments.clients.set(doc.client.id, []);
                }
                roleDocuments.clients.get(doc.client.id)!.push(docData);
            }
        });

        // Helper to group by document type
        const groupByDocType = (docs: any[]) => {
            const typeMap: { [key: string]: any[] } = {};
            docs.forEach(doc => {
                const type = doc.documentType || 'OTHER';
                if (!typeMap[type]) typeMap[type] = [];
                typeMap[type].push(doc);
            });
            return Object.entries(typeMap).map(([type, documents]) => ({
                type,
                count: documents.length,
                documents,
            }));
        };

        // Build response structure
        const response = {
            selfDocuments: {
                title: 'Self Documents',
                users: roleDocuments.self.length > 0 ? [{
                    userId: pmId,
                    userName: pmInfo?.name || 'Project Manager (You)',
                    userEmail: pmInfo?.email || req.user?.email || '',
                    documentTypes: groupByDocType(roleDocuments.self),
                }] : [],
                totalFiles: roleDocuments.self.length,
            },
            teamMemberDocuments: {
                title: 'Team Members Documents',
                users: Array.from(roleDocuments.teamMembers.entries()).map(([tmId, docs]) => {
                    const tm = tmMap.get(tmId);
                    return {
                        userId: tmId,
                        userName: tm?.name || 'Unknown TM',
                        userEmail: tm?.email || '',
                        documentTypes: groupByDocType(docs),
                    };
                }),
                totalFiles: Array.from(roleDocuments.teamMembers.values()).reduce((sum, docs) => sum + docs.length, 0),
            },
            clientDocuments: {
                title: 'Clients Documents',
                users: Array.from(roleDocuments.clients.entries()).map(([clientId, docs]) => {
                    const client = clientMap.get(clientId);
                    return {
                        userId: clientId,
                        userName: client?.name || 'Unknown Client',
                        userEmail: client?.email || '',
                        documentTypes: groupByDocType(docs),
                    };
                }),
                totalFiles: Array.from(roleDocuments.clients.values()).reduce((sum, docs) => sum + docs.length, 0),
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

// GET /api/project-manager/documents - List all documents in the firm
router.get('/documents', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Fetch all documents in the firm
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
                        email: true,
                    },
                },
                teamMember: {
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

// GET /api/project-manager/documents/:id - Get single document details
router.get('/documents/:id', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
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

// DELETE /api/project-manager/documents/:id - Soft delete document
router.delete('/documents/:id', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.userId || '';
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const document = await prisma.document.findFirst({
            where: { id, firmId },
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
                deletedBy: userId,
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

// GET /api/project-manager/documents/:id/download - Download document file
router.get('/documents/:id/download', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const document = await prisma.document.findFirst({
            where: { id, firmId },
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

        // If not found, try with process.cwd() prefix
        if (!fileExists) {
            filePath = path.join(process.cwd(), document.storagePath);
            fileExists = fsSync.existsSync(filePath);
        }

        // If still not found, try uploads directory
        if (!fileExists) {
            filePath = path.join(process.cwd(), 'uploads', document.storagePath);
            fileExists = fsSync.existsSync(filePath);
        }

        if (!fileExists) {
            console.error('File not found. Tried paths:', {
                original: document.storagePath,
                withCwd: path.join(process.cwd(), document.storagePath),
                withUploads: path.join(process.cwd(), 'uploads', document.storagePath),
            });
            res.status(404).json({
                success: false,
                message: 'File not found on server',
            });
            return;
        }

        // Set headers for file download
        res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

        // Stream the file
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

// POST /api/project-manager/documents/upload-self - Upload a self-document (PM's own document)
router.post('/documents/upload-self', authenticate, requireProjectManager, upload.single('file'), async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const firmId = req.user?.firmId;

        if (!userId || !firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        const { documentType, description } = req.body;

        // Save file to storage in pm-specific folder
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'project-manager', userId);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

        // Create document record (self-document, no clientId)
        const document = await prisma.document.create({
            data: {
                firmId,
                clientId: null, // Self-document, no client
                uploadedById: userId,
                uploadedByRole: 'PROJECT_MANAGER',
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
            message: 'Self-document uploaded successfully',
        });
    } catch (error) {
        console.error('Error uploading self-document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
        });
    }
});

// POST /api/project-manager/documents/upload - Upload a document (original endpoint)
router.post('/documents/upload', authenticate, requireProjectManager, upload.single('file'), async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const firmId = req.user?.firmId;

        if (!userId || !firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        const { documentType, description, clientId } = req.body;

        // If clientId is provided, verify it belongs to firm
        if (clientId) {
            const client = await prisma.client.findFirst({
                where: { id: clientId, firmId, deletedAt: null },
            });

            if (!client) {
                res.status(404).json({ success: false, message: 'Client not found' });
                return;
            }
        }

        // Save file to storage
        await ensureUploadDirectories();
        const folder = clientId || 'project-manager/' + userId;
        const uploadDir = path.join(process.cwd(), 'uploads', folder);
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
