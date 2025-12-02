import prisma from '../../shared/utils/prisma';
import fs from 'fs';
import path from 'path';

/**
 * Get all documents with role-based filtering
 */
export async function getAllDocuments(userContext: {
  id: string;
  role: string;
  firmId: string;
  clientId: string | null;
}, filters: { userId?: string; serviceId?: string; type?: string } = {}) {
  const where: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'CA') {
    // CA can see documents of their customers
    const whereUser: any = {
      firmId: userContext.firmId,
      role: 'CLIENT' as any,
    };
    if (userContext.clientId) {
      whereUser.clientId = userContext.clientId;
    }
    const userIds = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });
    where.userId = { in: userIds.map((u) => u.id) };
  } else if (userContext.role === 'CLIENT') {
    // CLIENT can only see their own documents
    where.userId = userContext.id;
  }

  // Apply filters
  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters.type) {
    where.documentType = filters.type as any;
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      user: {
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
    } as any,
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  // Convert BigInt fields to strings for JSON serialization
  return documents.map((doc: any) => ({
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
  };

  // Role-based filtering
  if (userContext.role === 'CA') {
    const whereUser: any = {
      firmId: userContext.firmId,
      role: 'CLIENT' as any,
    };
    if (userContext.clientId) {
      whereUser.clientId = userContext.clientId;
    }
    const userIds = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });
    where.userId = { in: userIds.map((u) => u.id) };
  } else if (userContext.role === 'CLIENT') {
    where.userId = userContext.id;
  }

  const document = await prisma.document.findFirst({
    where,
    include: {
      user: {
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
    } as any,
  });

  if (!document) {
    throw new Error('Document not found');
  }

  return document;
}

/**
 * Upload document
 */
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
    userId?: string;
  }
) {
  // Determine userId - CLIENT uploads for themselves, ADMIN/CA can specify
  let userId = userContext.id;

  if (userContext.role === 'ADMIN' || userContext.role === 'CA') {
    if (documentData.userId) {
      // Verify that this user belongs to the firm/CA
      const whereUser: any = {
        id: documentData.userId,
        firmId: userContext.firmId,
        role: 'CLIENT' as any,
      };

      if (userContext.role === 'CA' && userContext.clientId) {
        whereUser.clientId = userContext.clientId;
      }

      const targetUser = await prisma.user.findFirst({
        where: whereUser,
      });

      if (!targetUser) {
        throw new Error('Invalid user ID or user not found');
      }
      userId = documentData.userId;
    }
    // If no userId provided, it defaults to uploader (CA/ADMIN themselves)
  }

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
  const storagePath = path.join('uploads', userId, uniqueFileName);
  const fullPath = path.join(process.cwd(), storagePath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save file
  fs.writeFileSync(fullPath, file.buffer);

  // Create document record
  const document = await prisma.document.create({
    data: {
      firmId: userContext.firmId,
      userId,
      serviceId: documentData.serviceId || null,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: BigInt(file.size),
      storagePath,
      documentType: documentData.documentType as any,
      description: documentData.description || null,
      status: 'PENDING',
    } as any,
    include: {
      user: {
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
    } as any,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      firmId: userContext.firmId,
      userId: userContext.id,
      action: 'UPLOAD',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.fileName,
      details: {
        documentType: documentData.documentType,
        uploadedFor: userId,
      },
    },
  });

  // Trigger Pusher event
  await triggerDocumentEvent(userContext.firmId, userId, 'document-uploaded', document);

  return document;
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
    include: { user: true },
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
    } as any,
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      firmId: userContext.firmId,
      userId: userContext.id,
      action: 'UPDATE_STATUS',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.fileName,
      details: {
        oldStatus: (document as any).status,
        newStatus: status,
      },
    },
  });

  // Trigger Pusher event
  await triggerDocumentEvent(userContext.firmId, document.userId, 'document-updated', updatedDocument);

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
  const fullPath = path.join(process.cwd(), document.storagePath);

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
 * Delete document
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
  const document = await getDocumentById(id, userContext);

  // Delete file from filesystem
  const fullPath = path.join(process.cwd(), document.storagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Delete document record
  await prisma.document.delete({
    where: { id },
  });

  return { success: true };
}
