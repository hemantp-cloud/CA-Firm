import prisma from '../../shared/utils/prisma';
import fs from 'fs';
import path from 'path';

/**
 * Get all documents with role-based filtering
 * Updated to work with new schema (no 'user' table, use 'client' instead)
 */
export async function getAllDocuments(userContext: {
  id: string;
  role: string;
  firmId: string;
  clientId: string | null;
}, filters: { clientId?: string; serviceId?: string; type?: string } = {}) {
  const where: any = {
    firmId: userContext.firmId,
    isDeleted: false,
    NOT: {
      hiddenFrom: {
        has: userContext.role, // Exclude documents hidden from this role
      },
    },
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    // Project Manager can see ALL documents from Team Members and Clients in the firm
    // Get all Team Member IDs and Client IDs in the firm
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        firmId: userContext.firmId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const clients = await prisma.client.findMany({
      where: {
        firmId: userContext.firmId,
        deletedAt: null,
      },
      select: { id: true },
    });

    // Show documents that belong to any client OR uploaded by any team member in the firm
    where.OR = [
      { clientId: { in: clients.map((c) => c.id) } },
      { teamMemberId: { in: teamMembers.map((tm) => tm.id) } },
    ];
  } else if (userContext.role === 'CLIENT') {
    // CLIENT can only see their own documents
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    // Team member can see documents of assigned clients only
    const assignments = await prisma.clientAssignment.findMany({
      where: {
        teamMemberId: userContext.id,
      },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map((a) => a.clientId) };
  }
  // ADMIN and SUPER_ADMIN can see all documents in the firm (no additional filter)

  // Apply filters
  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters.type) {
    where.documentType = filters.type;
  }

  const documents = await prisma.document.findMany({
    where,
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

  // Convert BigInt fields to strings for JSON serialization
  return documents.map((doc) => ({
    ...doc,
    fileSize: doc.fileSize?.toString() || '0',
  }));
}

/**
 * Get document by ID with ownership check
 */
export async function getDocumentById(
  id: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  }
) {
  const where: any = {
    id,
    firmId: userContext.firmId,
    isDeleted: false,
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    const managedClients = await prisma.client.findMany({
      where: {
        firmId: userContext.firmId,
        managedBy: userContext.id,
        deletedAt: null,
      },
      select: { id: true },
    });
    where.clientId = { in: managedClients.map((c) => c.id) };
  } else if (userContext.role === 'CLIENT') {
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map((a) => a.clientId) };
  }

  const document = await prisma.document.findFirst({
    where,
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
  });

  if (!document) {
    throw new Error('Document not found');
  }

  return document;
}

import { triggerDocumentEvent } from '../../shared/services/pusher.service';

/**
 * Upload document
 */
export async function uploadDocument(
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  },
  file: Express.Multer.File,
  documentData: {
    documentType: string;
    serviceId?: string;
    description?: string;
    clientId?: string;
  }
) {
  // Determine clientId
  let clientId: string | null = null;

  if (userContext.role === 'CLIENT') {
    // Client uploads for themselves
    clientId = userContext.id;
  } else if (['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(userContext.role)) {
    // Staff can upload for a client
    if (documentData.clientId) {
      // Verify that this client belongs to the firm
      const targetClient = await prisma.client.findFirst({
        where: {
          id: documentData.clientId,
          firmId: userContext.firmId,
          deletedAt: null,
        },
      });

      if (!targetClient) {
        throw new Error('Invalid client ID or client not found');
      }
      clientId = documentData.clientId;
    }
  }

  if (!clientId) {
    throw new Error('Client ID is required for document upload');
  }

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
  const storagePath = path.join('uploads', clientId, uniqueFileName);
  const fullPath = path.join(process.cwd(), storagePath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save file
  fs.writeFileSync(fullPath, file.buffer);

  // Determine if uploaded by team member
  const teamMemberId = userContext.role === 'TEAM_MEMBER' ? userContext.id : null;

  // Create document record
  const document = await prisma.document.create({
    data: {
      firmId: userContext.firmId,
      clientId,
      serviceId: documentData.serviceId || null,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: BigInt(file.size),
      storagePath,
      documentType: documentData.documentType as any,
      description: documentData.description || null,
      status: 'PENDING',
      teamMemberId,
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
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      firmId: userContext.firmId,
      userId: userContext.id,
      userType: userContext.role,
      action: 'UPLOAD',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.fileName,
      details: {
        documentType: documentData.documentType,
        uploadedFor: clientId,
      },
    },
  });

  // Trigger Pusher event
  await triggerDocumentEvent(userContext.firmId, clientId, 'document-uploaded', document);

  return {
    ...document,
    fileSize: document.fileSize.toString(),
  };
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  id: string,
  status: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
  }
) {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.firmId !== userContext.firmId) {
    throw new Error('Unauthorized');
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      status: status as any,
      approvedAt: status === 'APPROVED' ? new Date() : null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      firmId: userContext.firmId,
      userId: userContext.id,
      userType: userContext.role,
      action: 'UPDATE_STATUS',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.fileName,
      details: {
        oldStatus: document.status,
        newStatus: status,
      },
    },
  });

  // Trigger Pusher event
  if (document.clientId) {
    await triggerDocumentEvent(userContext.firmId, document.clientId, 'document-updated', updatedDocument);
  }

  return updatedDocument;
}

/**
 * Download document file
 */
export async function downloadDocument(
  id: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  }
) {
  const document = await getDocumentById(id, userContext);

  // Handle both absolute and relative paths
  let fullPath: string;
  if (path.isAbsolute(document.storagePath)) {
    fullPath = document.storagePath;
  } else {
    fullPath = path.join(process.cwd(), document.storagePath);
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error('File not found on server');
  }

  return {
    filePath: fullPath,
    fileName: document.fileName,
    mimeType: document.fileType,
  };
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(
  id: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  }
) {
  await getDocumentById(id, userContext);

  // Soft delete the document
  await prisma.document.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userContext.id,
    },
  });

  return { success: true };
}

/**
 * Hide document from current user's role (soft hide, not delete)
 */
export async function hideDocument(
  id: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  }
) {
  // Verify document exists and user has access
  await getDocumentById(id, userContext);

  // Add current role to hiddenFrom array
  await prisma.document.update({
    where: { id },
    data: {
      hiddenFrom: {
        push: userContext.role, // Add role to hiddenFrom array
      },
    },
  });

  return { success: true };
}

/**
 * Hard delete document (for cleanup)
 */
export async function hardDeleteDocument(
  id: string,
  userContext: {
    id: string;
    role: string;
    firmId: string;
    clientId: string | null;
  }
) {
  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc || doc.firmId !== userContext.firmId) {
    throw new Error('Document not found');
  }

  // Delete file from filesystem
  const fullPath = path.join(process.cwd(), doc.storagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Hard delete document record
  await prisma.document.delete({
    where: { id },
  });

  return { success: true };
}
