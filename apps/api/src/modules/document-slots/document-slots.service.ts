import prisma from '../../shared/utils/prisma';
import { SlotStatus } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface UserContext {
    id: string;
    role: string;
    firmId: string;
    name: string;
    clientId?: string;
}

interface RequiredDocument {
    documentMasterId?: string;
    name: string;
    category?: string;
    isRequired: boolean;
    isCustom: boolean;
}

interface SlotAction {
    slotId: string;
    action: 'LINK' | 'REQUEST' | 'SKIP';
    linkedDocumentId?: string;
    deadline?: string;
    instructions?: string;
    priority?: string;
}

// ============================================
// CREATE SLOTS FROM SERVICE REQUIREMENTS
// ============================================

/**
 * Create document slots for a service based on requiredDocuments
 * Called when service is created or when PM first requests documents
 */
export async function createSlotsFromRequirements(
    serviceId: string,
    firmId: string,
    clientId: string,
    requiredDocuments: RequiredDocument[]
) {
    const slots = [];

    for (const doc of requiredDocuments) {
        const slot = await prisma.serviceDocumentSlot.create({
            data: {
                firmId,
                serviceId,
                clientId,
                documentMasterId: doc.documentMasterId || null,
                documentName: doc.name,
                documentCode: doc.documentMasterId ? doc.name.toUpperCase().replace(/\s+/g, '_') : null,
                category: doc.category || null,
                isRequired: doc.isRequired,
                isCustom: doc.isCustom,
                status: 'NOT_STARTED',
            },
        });
        slots.push(slot);
    }

    return slots;
}

// ============================================
// GET SLOTS FOR SERVICE
// ============================================

/**
 * Get all document slots for a service with linked/uploaded document details
 */
export async function getServiceSlots(serviceId: string, firmId: string) {
    return await prisma.serviceDocumentSlot.findMany({
        where: {
            serviceId,
            firmId,
        },
        include: {
            linkedDocument: {
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                    uploadedAt: true,
                    storagePath: true,
                },
            },
            uploadedDocument: {
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                    uploadedAt: true,
                    storagePath: true,
                },
            },
        },
        orderBy: [
            { isRequired: 'desc' },
            { createdAt: 'asc' },
        ],
    });
}

// ============================================
// FIND MATCHING DOCUMENTS IN CLIENT REPOSITORY
// ============================================

/**
 * Find documents in client repository that might match slot requirements
 */
export async function findMatchingDocuments(
    firmId: string,
    clientId: string,
    slotId: string
) {
    const slot = await prisma.serviceDocumentSlot.findFirst({
        where: { id: slotId, firmId },
    });

    if (!slot) {
        throw new Error('Slot not found');
    }

    // Search for matching documents by name similarity or document type
    const matchingDocs = await prisma.document.findMany({
        where: {
            firmId,
            clientId,
            isDeleted: false,
            OR: [
                // Match by document type enum (if it matches)
                slot.documentCode ? {
                    documentType: slot.documentCode as any,
                } : {},
                // Match by file name containing document name
                {
                    fileName: {
                        contains: slot.documentName,
                        mode: 'insensitive',
                    },
                },
            ],
        },
        select: {
            id: true,
            fileName: true,
            fileType: true,
            documentType: true,
            uploadedAt: true,
            description: true,
            storagePath: true,
        },
        orderBy: { uploadedAt: 'desc' },
        take: 10, // Limit results
    });

    return matchingDocs;
}

/**
 * Get all client documents for manual selection
 */
export async function getClientDocuments(firmId: string, clientId: string) {
    return await prisma.document.findMany({
        where: {
            firmId,
            clientId,
            isDeleted: false,
        },
        select: {
            id: true,
            fileName: true,
            fileType: true,
            documentType: true,
            uploadedAt: true,
            description: true,
        },
        orderBy: { uploadedAt: 'desc' },
    });
}

// ============================================
// PROCESS SLOT ACTIONS (LINK/REQUEST)
// ============================================

/**
 * Process multiple slot actions from PM
 */
export async function processSlotActions(
    serviceId: string,
    user: UserContext,
    actions: SlotAction[],
    globalMessage?: string
) {
    const results = {
        linked: 0,
        requested: 0,
        skipped: 0,
        errors: [] as string[],
    };

    for (const action of actions) {
        try {
            switch (action.action) {
                case 'LINK':
                    if (!action.linkedDocumentId) {
                        results.errors.push(`Slot ${action.slotId}: No document ID provided for linking`);
                        continue;
                    }

                    await prisma.serviceDocumentSlot.update({
                        where: { id: action.slotId },
                        data: {
                            status: 'LINKED',
                            linkedDocumentId: action.linkedDocumentId,
                            linkedAt: new Date(),
                            linkedById: user.id,
                            linkedByName: user.name,
                        },
                    });
                    results.linked++;
                    break;

                case 'REQUEST':
                    await prisma.serviceDocumentSlot.update({
                        where: { id: action.slotId },
                        data: {
                            status: 'REQUESTED',
                            requestedAt: new Date(),
                            requestedById: user.id,
                            requestedByName: user.name,
                            deadline: action.deadline ? new Date(action.deadline) : null,
                            requestMessage: action.instructions || globalMessage || null,
                            priority: action.priority || 'NORMAL',
                        },
                    });
                    results.requested++;
                    break;

                case 'SKIP':
                    // Just leave as NOT_STARTED or mark as skipped
                    results.skipped++;
                    break;
            }
        } catch (error: any) {
            results.errors.push(`Slot ${action.slotId}: ${error.message}`);
        }
    }

    // If any slots were requested, update service status
    if (results.requested > 0) {
        await prisma.service.update({
            where: { id: serviceId },
            data: { status: 'WAITING_FOR_CLIENT' },
        });

        // Log status change
        await prisma.serviceStatusHistory.create({
            data: {
                firmId: user.firmId,
                serviceId,
                fromStatus: 'IN_PROGRESS',
                toStatus: 'WAITING_FOR_CLIENT',
                action: 'REQUEST_DOCUMENTS',
                changedBy: user.id,
                changedByType: user.role,
                changedByName: user.name,
                notes: `Requested ${results.requested} document(s) from client. ${results.linked} document(s) linked from repository.`,
                metadata: { actions, globalMessage },
            },
        });
    }

    return results;
}

// ============================================
// CLIENT: UPLOAD DOCUMENT TO SLOT
// ============================================

/**
 * Upload document for a specific slot
 */
export async function uploadToSlot(
    slotId: string,
    documentId: string,
    user: UserContext
) {
    const slot = await prisma.serviceDocumentSlot.findFirst({
        where: { id: slotId },
        include: { service: true },
    });

    if (!slot) {
        throw new Error('Slot not found');
    }

    if (slot.clientId !== user.clientId) {
        throw new Error('Unauthorized: This slot belongs to a different client');
    }

    if (!['REQUESTED', 'REJECTED'].includes(slot.status)) {
        throw new Error('Cannot upload to this slot in current status');
    }

    // Update slot with uploaded document
    const updatedSlot = await prisma.serviceDocumentSlot.update({
        where: { id: slotId },
        data: {
            status: 'UPLOADED',
            uploadedDocumentId: documentId,
            uploadedAt: new Date(),
            rejectionReason: null, // Clear previous rejection
        },
        include: {
            uploadedDocument: {
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                },
            },
        },
    });

    // Check if all required slots are now fulfilled
    const allSlots = await prisma.serviceDocumentSlot.findMany({
        where: { serviceId: slot.serviceId, isRequired: true },
    });

    const allFulfilled = allSlots.every(s =>
        ['LINKED', 'UPLOADED', 'APPROVED'].includes(s.status)
    );

    // If all required docs uploaded, service can potentially resume
    // But we don't auto-change status - PM needs to review

    return updatedSlot;
}

// ============================================
// PM: REVIEW UPLOADED DOCUMENT
// ============================================

/**
 * Approve a document in a slot
 */
export async function approveSlotDocument(
    slotId: string,
    user: UserContext,
    notes?: string
) {
    const slot = await prisma.serviceDocumentSlot.findFirst({
        where: { id: slotId, firmId: user.firmId },
    });

    if (!slot) {
        throw new Error('Slot not found');
    }

    if (!['UPLOADED', 'LINKED'].includes(slot.status)) {
        throw new Error('No document to approve in this slot');
    }

    return await prisma.serviceDocumentSlot.update({
        where: { id: slotId },
        data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewedByName: user.name,
        },
    });
}

/**
 * Reject a document in a slot
 */
export async function rejectSlotDocument(
    slotId: string,
    user: UserContext,
    reason: string
) {
    const slot = await prisma.serviceDocumentSlot.findFirst({
        where: { id: slotId, firmId: user.firmId },
    });

    if (!slot) {
        throw new Error('Slot not found');
    }

    if (slot.status !== 'UPLOADED') {
        throw new Error('No uploaded document to reject');
    }

    return await prisma.serviceDocumentSlot.update({
        where: { id: slotId },
        data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewedByName: user.name,
            rejectionReason: reason,
        },
    });
}

// ============================================
// GET SLOTS FOR CLIENT PORTAL
// ============================================

/**
 * Get slots for a client's service view
 */
export async function getClientServiceSlots(
    serviceId: string,
    clientId: string,
    firmId: string
) {
    return await prisma.serviceDocumentSlot.findMany({
        where: {
            serviceId,
            clientId,
            firmId,
            // Only show slots that have been actioned (not NOT_STARTED)
            status: {
                not: 'NOT_STARTED',
            },
        },
        include: {
            linkedDocument: {
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                    uploadedAt: true,
                },
            },
            uploadedDocument: {
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                    uploadedAt: true,
                },
            },
        },
        orderBy: [
            { isRequired: 'desc' },
            { status: 'asc' }, // Show REQUESTED first
            { createdAt: 'asc' },
        ],
    });
}

// ============================================
// ADD NEW SLOT TO EXISTING SERVICE
// ============================================

/**
 * Add additional document slot to service
 */
export async function addSlotToService(
    serviceId: string,
    user: UserContext,
    documentData: {
        name: string;
        category?: string;
        isRequired: boolean;
        isCustom: boolean;
        documentMasterId?: string;
    }
) {
    const service = await prisma.service.findFirst({
        where: { id: serviceId, firmId: user.firmId },
    });

    if (!service) {
        throw new Error('Service not found');
    }

    return await prisma.serviceDocumentSlot.create({
        data: {
            firmId: user.firmId,
            serviceId,
            clientId: service.clientId,
            documentMasterId: documentData.documentMasterId || null,
            documentName: documentData.name,
            documentCode: documentData.name.toUpperCase().replace(/\s+/g, '_'),
            category: documentData.category || null,
            isRequired: documentData.isRequired,
            isCustom: documentData.isCustom,
            status: 'NOT_STARTED',
        },
    });
}

// ============================================
// CHECK ALL REQUIRED SLOTS APPROVED
// ============================================

/**
 * Check if all required slots are approved/linked
 */
export async function checkAllRequiredApproved(serviceId: string) {
    const slots = await prisma.serviceDocumentSlot.findMany({
        where: { serviceId, isRequired: true },
    });

    const total = slots.length;
    const approved = slots.filter(s => ['APPROVED', 'LINKED'].includes(s.status)).length;
    const pending = slots.filter(s => ['REQUESTED', 'NOT_STARTED'].includes(s.status)).length;
    const uploaded = slots.filter(s => s.status === 'UPLOADED').length;
    const rejected = slots.filter(s => s.status === 'REJECTED').length;

    return {
        total,
        approved,
        pending,
        uploaded,
        rejected,
        allApproved: approved === total && total > 0,
        readyForReview: uploaded > 0,
    };
}
