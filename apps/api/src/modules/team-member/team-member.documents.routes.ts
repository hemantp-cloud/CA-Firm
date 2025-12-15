import { Router } from 'express';
import { authenticate, requireTeamMember, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import multer from 'multer';
import { ensureUploadDirectories } from '../../shared/utils/file-storage';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../../shared/utils/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/team-member/documents/hierarchy - Get documents organized by role hierarchy
// Team Member can see: Self Documents + Assigned Clients Documents ONLY
router.get('/documents/hierarchy', authenticate, requireTeamMember, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const tmId = req.user?.userId;

        if (!firmId || !tmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Fetch TM's info
        const tmInfo = await prisma.teamMember.findFirst({
            where: { id: tmId },
            select: { id: true, name: true, email: true }
        });

        // Get assigned clients for this team member
        const clientAssignments = await prisma.clientAssignment.findMany({
            where: { teamMemberId: tmId },
            include: {
                client: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        const assignedClientIds = clientAssignments.map(ca => ca.clientId);
        const clientMap = new Map(clientAssignments.map(ca => [ca.client.id, ca.client]));

        // Fetch documents - Self documents AND documents from assigned clients
        const allDocuments = await prisma.document.findMany({
            where: {
                firmId,
                isDeleted: false,
                OR: [
                    // Self-documents (uploaded by this TM)
                    { uploadedByRole: 'TEAM_MEMBER', uploadedById: tmId },
                    // Documents linked to this TM
                    { teamMemberId: tmId },
                    // Documents from assigned clients
                    { clientId: { in: assignedClientIds } },
                ],
            },
            include: {
                client: { select: { id: true, name: true, email: true } },
                teamMember: { select: { id: true, name: true, email: true } },
                service: { select: { id: true, title: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });

        // Structure for each role section
        const roleDocuments = {
            self: [] as any[],        // TM's own documents
            clients: new Map<string, any[]>(),  // Only ASSIGNED clients
        };

        // Process each document
        allDocuments.forEach((doc: any) => {
            const docData = {
                ...doc,
                fileSize: doc.fileSize?.toString() || '0',
            };

            // Check if this is a self-document (uploaded by TM or linked to TM)
            if ((doc.uploadedByRole === 'TEAM_MEMBER' && doc.uploadedById === tmId) || doc.teamMemberId === tmId) {
                // Avoid duplicates - don't add if it's also a client document
                if (!doc.clientId || !assignedClientIds.includes(doc.clientId)) {
                    roleDocuments.self.push(docData);
                } else if (doc.teamMemberId === tmId) {
                    // If TM uploaded for a client, show in self
                    roleDocuments.self.push(docData);
                }
            }
            // If document belongs to an assigned client
            else if (doc.clientId && assignedClientIds.includes(doc.clientId)) {
                if (!roleDocuments.clients.has(doc.clientId)) {
                    roleDocuments.clients.set(doc.clientId, []);
                }
                roleDocuments.clients.get(doc.clientId)!.push(docData);
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
                    userId: tmId,
                    userName: tmInfo?.name || 'Team Member (You)',
                    userEmail: tmInfo?.email || req.user?.email || '',
                    documentTypes: groupByDocType(roleDocuments.self),
                }] : [],
                totalFiles: roleDocuments.self.length,
            },
            clientDocuments: {
                title: 'Assigned Clients Documents',
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

// GET /api/team-member/documents - List documents accessible to team member
router.get('/documents', authenticate, requireTeamMember, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const tmId = req.user?.userId;

        if (!firmId || !tmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Get assigned client IDs
        const clientAssignments = await prisma.clientAssignment.findMany({
            where: { teamMemberId: tmId },
            select: { clientId: true }
        });
        const assignedClientIds = clientAssignments.map(ca => ca.clientId);

        // Fetch documents
        const documents = await prisma.document.findMany({
            where: {
                firmId,
                isDeleted: false,
                OR: [
                    { uploadedByRole: 'TEAM_MEMBER', uploadedById: tmId },
                    { teamMemberId: tmId },
                    { clientId: { in: assignedClientIds } },
                ],
            },
            include: {
                client: { select: { id: true, name: true, email: true } },
                teamMember: { select: { id: true, name: true, email: true } },
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

// GET /api/team-member/documents/:id - Get single document details
router.get('/documents/:id', authenticate, requireTeamMember, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;
        const tmId = req.user?.userId;

        if (!firmId || !tmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Get assigned client IDs
        const clientAssignments = await prisma.clientAssignment.findMany({
            where: { teamMemberId: tmId },
            select: { clientId: true }
        });
        const assignedClientIds = clientAssignments.map(ca => ca.clientId);

        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                OR: [
                    { uploadedByRole: 'TEAM_MEMBER', uploadedById: tmId },
                    { teamMemberId: tmId },
                    { clientId: { in: assignedClientIds } },
                ],
            },
            include: {
                client: { select: { id: true, name: true, email: true } },
                service: true,
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found or access denied',
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

// DELETE /api/team-member/documents/:id - Soft delete document (only own documents)
router.delete('/documents/:id', authenticate, requireTeamMember, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.userId || '';
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Team Member can only delete their own documents
        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                OR: [
                    { uploadedByRole: 'TEAM_MEMBER', uploadedById: userId },
                    { teamMemberId: userId },
                ],
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found or you can only delete your own documents',
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

// GET /api/team-member/documents/:id/download - Download document file
router.get('/documents/:id/download', authenticate, requireTeamMember, async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
        const id = String(req.params.id);
        const firmId = req.user?.firmId;
        const tmId = req.user?.userId;

        if (!firmId || !tmId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Get assigned client IDs
        const clientAssignments = await prisma.clientAssignment.findMany({
            where: { teamMemberId: tmId },
            select: { clientId: true }
        });
        const assignedClientIds = clientAssignments.map(ca => ca.clientId);

        const document = await prisma.document.findFirst({
            where: {
                id,
                firmId,
                OR: [
                    { uploadedByRole: 'TEAM_MEMBER', uploadedById: tmId },
                    { teamMemberId: tmId },
                    { clientId: { in: assignedClientIds } },
                ],
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found or access denied',
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

// POST /api/team-member/documents/upload-self - Upload a self-document
router.post('/documents/upload-self', authenticate, requireTeamMember, upload.single('file'), async (req: AuthenticatedRequest, res): Promise<void> => {
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

        // Save file to storage in tm-specific folder
        await ensureUploadDirectories();
        const uploadDir = path.join(process.cwd(), 'uploads', 'team-member', userId);
        await fs.mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${req.file.originalname}`;
        const storagePath = path.join(uploadDir, filename);
        await fs.writeFile(storagePath, req.file.buffer);

        // Create document record (self-document, no clientId)
        const document = await prisma.document.create({
            data: {
                firmId,
                clientId: null,
                teamMemberId: userId, // Link to this TM
                uploadedById: userId,
                uploadedByRole: 'TEAM_MEMBER',
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

// POST /api/team-member/documents/upload - Upload document for client
router.post('/documents/upload', authenticate, requireTeamMember, upload.single('file'), async (req: AuthenticatedRequest, res): Promise<void> => {
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

        // If clientId is provided, verify TM is assigned to this client
        if (clientId) {
            const assignment = await prisma.clientAssignment.findFirst({
                where: { teamMemberId: userId, clientId },
            });

            if (!assignment) {
                res.status(403).json({ success: false, message: 'You are not assigned to this client' });
                return;
            }
        }

        // Save file to storage
        await ensureUploadDirectories();
        const folder = clientId || 'team-member/' + userId;
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
                teamMemberId: userId,
                uploadedById: userId,
                uploadedByRole: 'TEAM_MEMBER',
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
