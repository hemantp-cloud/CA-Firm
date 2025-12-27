import { Router } from 'express';
import { z } from 'zod';
import {
    authenticate,
    requireProjectManager,
    requireTeamMember,
    requireClient,
    AuthenticatedRequest,
} from '../../shared/middleware/auth.middleware';
import * as slotService from './document-slots.service';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const slotActionSchema = z.object({
    slotId: z.string().uuid(),
    action: z.enum(['LINK', 'REQUEST', 'SKIP']),
    linkedDocumentId: z.string().uuid().optional(),
    deadline: z.string().optional(),
    instructions: z.string().optional(),
    priority: z.enum(['HIGH', 'NORMAL', 'LOW']).optional(),
});

const processActionsSchema = z.object({
    actions: z.array(slotActionSchema).min(1),
    globalMessage: z.string().optional(),
});

const addSlotSchema = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    isRequired: z.boolean().default(true),
    isCustom: z.boolean().default(false),
    documentMasterId: z.string().uuid().optional(),
});

const reviewSchema = z.object({
    notes: z.string().optional(),
});

const rejectSchema = z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
});

// ============================================
// PM/TM ROUTES
// ============================================

/**
 * GET /api/document-slots/services/:serviceId/slots
 * Get all document slots for a service
 */
router.get(
    '/services/:serviceId/slots',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;
            const firmId = req.user?.firmId;

            if (!firmId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const slots = await slotService.getServiceSlots(serviceId, firmId);

            res.json({
                success: true,
                data: slots,
            });
        } catch (error) {
            console.error('Error fetching service slots:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch document slots',
            });
        }
    }
);

/**
 * GET /api/document-slots/services/:serviceId/client-documents
 * Get all client documents for linking
 */
router.get(
    '/services/:serviceId/client-documents',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;
            const firmId = req.user?.firmId;

            if (!firmId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            // Get service to find client
            const service = await (await import('../../shared/utils/prisma')).default.service.findFirst({
                where: { id: serviceId, firmId },
                select: { clientId: true },
            });

            if (!service) {
                res.status(404).json({ success: false, message: 'Service not found' });
                return;
            }

            const documents = await slotService.getClientDocuments(firmId, service.clientId);

            res.json({
                success: true,
                data: documents,
            });
        } catch (error) {
            console.error('Error fetching client documents:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client documents',
            });
        }
    }
);

/**
 * GET /api/document-slots/slots/:slotId/matching-documents
 * Find matching documents for a specific slot
 */
router.get(
    '/slots/:slotId/matching-documents',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { slotId } = req.params;
            const firmId = req.user?.firmId;

            if (!firmId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            // Get slot to find client
            const slot = await (await import('../../shared/utils/prisma')).default.serviceDocumentSlot.findFirst({
                where: { id: slotId, firmId },
                select: { clientId: true },
            });

            if (!slot) {
                res.status(404).json({ success: false, message: 'Slot not found' });
                return;
            }

            const documents = await slotService.findMatchingDocuments(firmId, slot.clientId, slotId);

            res.json({
                success: true,
                data: documents,
            });
        } catch (error) {
            console.error('Error finding matching documents:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to find matching documents',
            });
        }
    }
);

/**
 * POST /api/document-slots/services/:serviceId/process-actions
 * Process link/request actions for slots
 */
router.post(
    '/services/:serviceId/process-actions',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;
            const firmId = req.user?.firmId;
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Unknown';

            if (!firmId || !userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const validated = processActionsSchema.parse(req.body);

            const result = await slotService.processSlotActions(
                serviceId,
                {
                    id: userId,
                    role: 'PROJECT_MANAGER',
                    firmId,
                    name: userName,
                },
                validated.actions,
                validated.globalMessage
            );

            res.json({
                success: true,
                data: result,
                message: `Processed ${result.linked} links, ${result.requested} requests, ${result.skipped} skipped`,
            });
        } catch (error: any) {
            console.error('Error processing slot actions:', error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process slot actions',
            });
        }
    }
);

/**
 * POST /api/document-slots/services/:serviceId/slots
 * Add new slot to service
 */
router.post(
    '/services/:serviceId/slots',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;
            const firmId = req.user?.firmId;
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Unknown';

            if (!firmId || !userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const validated = addSlotSchema.parse(req.body);

            const slot = await slotService.addSlotToService(
                serviceId,
                {
                    id: userId,
                    role: 'PROJECT_MANAGER',
                    firmId,
                    name: userName,
                },
                validated
            );

            res.json({
                success: true,
                data: slot,
                message: 'Document slot added successfully',
            });
        } catch (error: any) {
            console.error('Error adding slot:', error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add document slot',
            });
        }
    }
);

/**
 * POST /api/document-slots/slots/:slotId/approve
 * Approve document in slot
 */
router.post(
    '/slots/:slotId/approve',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { slotId } = req.params;
            const firmId = req.user?.firmId;
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Unknown';

            if (!firmId || !userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { notes } = reviewSchema.parse(req.body);

            const slot = await slotService.approveSlotDocument(
                slotId,
                {
                    id: userId,
                    role: 'PROJECT_MANAGER',
                    firmId,
                    name: userName,
                },
                notes
            );

            res.json({
                success: true,
                data: slot,
                message: 'Document approved successfully',
            });
        } catch (error: any) {
            console.error('Error approving document:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to approve document',
            });
        }
    }
);

/**
 * POST /api/document-slots/slots/:slotId/reject
 * Reject document in slot
 */
router.post(
    '/slots/:slotId/reject',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { slotId } = req.params;
            const firmId = req.user?.firmId;
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Unknown';

            if (!firmId || !userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { reason } = rejectSchema.parse(req.body);

            const slot = await slotService.rejectSlotDocument(
                slotId,
                {
                    id: userId,
                    role: 'PROJECT_MANAGER',
                    firmId,
                    name: userName,
                },
                reason
            );

            res.json({
                success: true,
                data: slot,
                message: 'Document rejected. Client will be notified to re-upload.',
            });
        } catch (error: any) {
            console.error('Error rejecting document:', error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reject document',
            });
        }
    }
);

/**
 * GET /api/document-slots/services/:serviceId/status
 * Get slot completion status for service
 */
router.get(
    '/services/:serviceId/status',
    authenticate,
    requireProjectManager,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;

            const status = await slotService.checkAllRequiredApproved(serviceId);

            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            console.error('Error checking slot status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check slot status',
            });
        }
    }
);

// ============================================
// CLIENT ROUTES
// ============================================

/**
 * GET /api/document-slots/client/services/:serviceId/slots
 * Get slots for client's service (only actioned slots)
 */
router.get(
    '/client/services/:serviceId/slots',
    authenticate,
    requireClient,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { serviceId } = req.params;
            const firmId = req.user?.firmId;
            const clientId = req.user?.clientId;

            if (!firmId || !clientId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const slots = await slotService.getClientServiceSlots(serviceId, clientId, firmId);

            res.json({
                success: true,
                data: slots,
            });
        } catch (error) {
            console.error('Error fetching client slots:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch document slots',
            });
        }
    }
);

/**
 * POST /api/document-slots/client/slots/:slotId/upload
 * Upload document to a slot (after file is uploaded to documents)
 */
router.post(
    '/client/slots/:slotId/upload',
    authenticate,
    requireClient,
    async (req: AuthenticatedRequest, res): Promise<void> => {
        try {
            const { slotId } = req.params;
            const { documentId } = req.body;
            const firmId = req.user?.firmId;
            const clientId = req.user?.clientId;
            const userId = req.user?.userId;
            const userName = req.user?.name || 'Client';

            if (!firmId || !clientId || !userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            if (!documentId) {
                res.status(400).json({ success: false, message: 'Document ID is required' });
                return;
            }

            const slot = await slotService.uploadToSlot(
                slotId,
                documentId,
                {
                    id: userId,
                    role: 'CLIENT',
                    firmId,
                    name: userName,
                    clientId,
                }
            );

            res.json({
                success: true,
                data: slot,
                message: 'Document uploaded to slot successfully',
            });
        } catch (error: any) {
            console.error('Error uploading to slot:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload document to slot',
            });
        }
    }
);

export default router;
