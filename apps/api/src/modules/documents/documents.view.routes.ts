import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import prisma from '../../shared/utils/prisma';
import fs from 'fs';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/documents/view/:id
 * View/download a document file
 */
router.get('/view/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Document ID is required',
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }

        // Get document
        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        // Check permissions
        const canView =
            document.userId === userId || // Owner
            userRole === 'ADMIN' || // Admin can view all
            userRole === 'CA'; // CA can view all

        if (!canView) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to view this document',
            });
            return;
        }

        // Check if file exists - try multiple possible paths
        let filePath = document.storagePath;
        let fileExists = fs.existsSync(filePath);

        // If not found, try with process.cwd() prefix
        if (!fileExists) {
            const path = require('path');
            filePath = path.join(process.cwd(), document.storagePath);
            fileExists = fs.existsSync(filePath);
        }

        // If still not found, try uploads directory
        if (!fileExists) {
            const path = require('path');
            filePath = path.join(process.cwd(), 'uploads', document.storagePath);
            fileExists = fs.existsSync(filePath);
        }

        if (!fileExists) {
            console.error('File not found. Tried paths:', {
                original: document.storagePath,
                withCwd: require('path').join(process.cwd(), document.storagePath),
                withUploads: require('path').join(process.cwd(), 'uploads', document.storagePath),
            });
            res.status(404).json({
                success: false,
                message: 'File not found on server',
            });
            return;
        }

        // Set headers for file download/view
        res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error: any) {
        console.error('Error viewing document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to view document',
        });
    }
});

/**
 * GET /api/documents/download/:id
 * Download a document file
 */
router.get('/download/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!id) {
            res.status(400).json({
                success: false,
                message: 'Document ID is required',
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }

        // Get document
        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            res.status(404).json({
                success: false,
                message: 'Document not found',
            });
            return;
        }

        // Check permissions
        const canDownload =
            document.userId === userId || // Owner
            userRole === 'ADMIN' || // Admin can download all
            userRole === 'CA'; // CA can download all

        if (!canDownload) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to download this document',
            });
            return;
        }

        // Check if file exists - try multiple possible paths
        let filePath = document.storagePath;
        let fileExists = fs.existsSync(filePath);

        // If not found, try with process.cwd() prefix
        if (!fileExists) {
            const path = require('path');
            filePath = path.join(process.cwd(), document.storagePath);
            fileExists = fs.existsSync(filePath);
        }

        // If still not found, try uploads directory
        if (!fileExists) {
            const path = require('path');
            filePath = path.join(process.cwd(), 'uploads', document.storagePath);
            fileExists = fs.existsSync(filePath);
        }

        if (!fileExists) {
            console.error('File not found. Tried paths:', {
                original: document.storagePath,
                withCwd: require('path').join(process.cwd(), document.storagePath),
                withUploads: require('path').join(process.cwd(), 'uploads', document.storagePath),
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
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error: any) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to download document',
        });
    }
});

export default router;
