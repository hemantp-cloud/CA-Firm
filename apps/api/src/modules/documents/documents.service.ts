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
  if (userContext.role === 'CLIENT') {
    // CLIENT can see documents of their users
    const whereUser: any = {
      firmId: userContext.firmId,
      role: 'USER' as any,
    };
    if (userContext.clientId) {
      whereUser.clientId = userContext.clientId;
    }
    const userIds = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });
    where.userId = { in: userIds.map((u) => u.id) };
  } else if (userContext.role === 'USER') {
    // USER can only see their own documents
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

  return await prisma.document.findMany({
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
  if (userContext.role === 'CLIENT') {
    const whereUser: any = {
      firmId: userContext.firmId,
      role: 'USER' as any,
    };
    if (userContext.clientId) {
      whereUser.clientId = userContext.clientId;
    }
    const userIds = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });
    where.userId = { in: userIds.map((u) => u.id) };
  } else if (userContext.role === 'USER') {
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
  }
) {
  // Determine userId - USER uploads for themselves, CA/CLIENT can specify
  let userId = userContext.id;
  
  if (userContext.role === 'CA' || userContext.role === 'CLIENT') {
    // CA/CLIENT can upload for any user under their firm/client
    // For now, we'll use the uploader's userId
    // In future, add userId to request body for CA/CLIENT
    userId = userContext.id;
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

  return document;
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
