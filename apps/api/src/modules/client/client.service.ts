import prisma from '../../shared/utils/prisma';

/**
 * Get dashboard statistics for CLIENT
 */
export async function getClientDashboard(userId: string, firmId: string) {
  // Get active services count
  const activeServicesCount = await (prisma as any).service.count({
    where: {
      userId,
      firmId,
      status: {
        in: ['IN_PROGRESS', 'UNDER_REVIEW'],
      },
    },
  });

  // Get pending invoices count
  const pendingInvoicesCount = await (prisma as any).invoice.count({
    where: {
      userId,
      firmId,
      status: {
        in: ['DRAFT', 'SENT', 'OVERDUE'],
      },
    },
  });

  // Get active services (last 5)
  const activeServices = await (prisma as any).service.findMany({
    where: {
      userId,
      firmId,
      status: {
        in: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      dueDate: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  // Get recent documents (last 5)
  const recentDocuments = await (prisma as any).document.findMany({
    where: {
      userId,
      firmId,
    },
    select: {
      id: true,
      fileName: true,
      documentType: true,
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    take: 5,
  });

  // Note: Documents from CA would need an uploaderId field to track
  // For now, we'll mark all as not from CA

  // Get pending invoices (last 3)
  const pendingInvoices = await (prisma as any).invoice.findMany({
    where: {
      userId,
      firmId,
      status: {
        in: ['DRAFT', 'SENT', 'OVERDUE'],
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      totalAmount: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3,
  });

  return {
    activeServicesCount,
    pendingInvoicesCount,
    activeServices: activeServices.map((service: any) => ({
      id: service.id,
      title: service.title,
      status: service.status,
      type: service.type,
      dueDate: service.dueDate?.toISOString() || null,
    })),
    recentDocuments: recentDocuments.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt.toISOString(),
      isFromCA: false, // TODO: Track uploader in document model
    })),
    pendingInvoices: pendingInvoices.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      totalAmount: Number(invoice.totalAmount),
      status: invoice.status,
    })),
  };
}

/**
 * Get all services for CLIENT
 */
export async function getClientServices(userId: string, firmId: string) {
  return await (prisma as any).service.findMany({
    where: {
      userId,
      firmId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      dueDate: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get service by ID (must belong to client)
 */
export async function getClientServiceById(serviceId: string, userId: string, firmId: string) {
  const service = await (prisma as any).service.findFirst({
    where: {
      id: serviceId,
      userId,
      firmId,
    },
    include: {
      documents: {
        select: {
          id: true,
          fileName: true,
          documentType: true,
          uploadedAt: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      },
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  return {
    id: service.id,
    title: service.title,
    description: service.description,
    type: service.type,
    status: service.status,
    dueDate: service.dueDate?.toISOString() || null,
    notes: service.notes,
    documents: service.documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt.toISOString(),
      isFromCA: false, // TODO: Track uploader
    })),
  };
}

/**
 * Get all documents for CLIENT
 */
export async function getClientDocuments(userId: string, firmId: string, filters: any = {}) {
  const where: any = {
    userId,
    firmId,
  };

  if (filters.type) {
    where.documentType = filters.type;
  }

  const documents = await (prisma as any).document.findMany({
    where,
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

  // Convert BigInt fields to strings for JSON serialization
  return documents.map((doc: any) => ({
    ...doc,
    fileSize: doc.fileSize?.toString() || '0',
  }));
}

/**
 * Upload document for CLIENT
 */
export async function uploadClientDocument(
  userId: string,
  firmId: string,
  fileData: any,
  documentType: string,
  serviceId: string | null,
  description: string | null
) {
  // In production, save file to storage (S3, local storage, etc.)
  // For now, we'll just create the document record
  const document = await prisma.document.create({
    data: {
      firmId,
      userId,
      serviceId: serviceId || null,
      fileName: fileData.originalname || fileData.name || 'document.pdf',
      fileType: fileData.mimetype || 'application/pdf',
      fileSize: BigInt(fileData.size || 0),
      storagePath: `/uploads/${userId}/${Date.now()}-${fileData.originalname || fileData.name}`,
      documentType: documentType as string,
      description: description || null,
    } as any,
  });

  // Convert BigInt to string for JSON serialization
  return {
    ...document,
    fileSize: document.fileSize.toString(),
  };
}

/**
 * Upload document as DRAFT (Phase 1 of two-stage upload)
 */
export async function uploadDraftDocument(
  userId: string,
  firmId: string,
  fileData: any,
  documentType: string,
  serviceId: string | null,
  description: string | null
) {
  const { getTempFilePath } = await import('../../shared/utils/file-storage');
  const fs = await import('fs/promises');
  const path = await import('path');

  // Generate document ID
  const documentId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get temp file path
  const tempPath = getTempFilePath(userId, documentId, fileData.originalname || fileData.name);

  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  await fs.mkdir(tempDir, { recursive: true });

  // Save uploaded file to temp storage
  // Multer memoryStorage provides buffer
  if (fileData.buffer) {
    await fs.writeFile(tempPath, fileData.buffer);
  } else {
    throw new Error('No file buffer available');
  }

  // Create document record with DRAFT status
  const document = await prisma.document.create({
    data: {
      firmId,
      userId,
      serviceId: serviceId || null,
      fileName: fileData.originalname || fileData.name || 'document.pdf',
      fileType: fileData.mimetype || 'application/pdf',
      fileSize: BigInt(fileData.size || 0),
      storagePath: tempPath,
      documentType: documentType as any,
      description: description || null,
      uploadStatus: 'DRAFT',
    } as any,
  });

  // Convert BigInt to string for JSON serialization
  return {
    ...document,
    fileSize: document.fileSize.toString(),
  };
}

/**
 * Submit draft documents (Phase 2 of two-stage upload)
 */
export async function submitDocuments(
  userId: string,
  firmId: string,
  documentIds: string[]
) {
  const {
    createClientFolder,
    moveFromTempToPermanent,
    getFolderPath,
    getPermanentFilePath,
    fileExists
  } = await import('../../shared/utils/file-storage');
  const { createActivityLog } = await import('../activity-log/activity-log.service');

  // Get user details for folder name
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const submittedDocuments = [];

  for (const documentId of documentIds) {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    if (document.userId !== userId) {
      throw new Error(`Unauthorized access to document ${documentId}`);
    }

    if (document.uploadStatus !== 'DRAFT') {
      throw new Error(`Document ${documentId} is not in DRAFT status`);
    }

    // Check if file exists at the stored path
    const fileExistsAtPath = await fileExists(document.storagePath);

    if (!fileExistsAtPath) {
      // File doesn't exist at stored path - might be an old upload
      // Delete the document record and skip
      await prisma.document.delete({
        where: { id: documentId },
      });
      throw new Error(`File not found for document ${document.fileName}. Please re-upload the document.`);
    }

    // Create client folder structure
    const documentType = document.documentType || 'OTHER';
    await createClientFolder(user.name, documentType);

    // Get permanent file path
    const permanentPath = getPermanentFilePath(user.name, documentType, document.fileName);
    const folderPath = getFolderPath(user.name, documentType);

    // Move file from temp to permanent
    await moveFromTempToPermanent(document.storagePath, permanentPath);

    // Update document status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        uploadStatus: 'SUBMITTED',
        submittedAt: new Date(),
        storagePath: permanentPath,
        folderPath: folderPath,
      },
    });

    // Create activity log
    await createActivityLog({
      firmId,
      userId,
      documentId,
      action: 'SUBMIT',
      entityType: 'Document',
      entityId: documentId,
      entityName: document.fileName,
      details: {
        documentType,
        fileName: document.fileName,
      },
    });

    submittedDocuments.push({
      ...updatedDocument,
      fileSize: updatedDocument.fileSize.toString(),
    });
  }

  // Broadcast SSE event to Admin and CA users
  const sseService = (await import('../sse/sse.service')).default;
  sseService.broadcastToRoles(firmId, ['ADMIN', 'CA'], 'documents-submitted', {
    clientName: user.name,
    clientId: userId,
    count: submittedDocuments.length,
    documents: submittedDocuments.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
    })),
  });

  return submittedDocuments;
}

/**
 * Delete draft document
 */
export async function deleteDraftDocument(
  userId: string,
  firmId: string,
  documentId: string
) {
  const { deleteFile } = await import('../../shared/utils/file-storage');

  // Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.userId !== userId) {
    throw new Error('Unauthorized access to document');
  }

  if (document.firmId !== firmId) {
    throw new Error('Document does not belong to your firm');
  }

  if (document.uploadStatus !== 'DRAFT') {
    throw new Error('Can only delete documents in DRAFT status');
  }

  // Delete file from storage
  await deleteFile(document.storagePath);

  // Delete document record
  await prisma.document.delete({
    where: { id: documentId },
  });

  return { success: true, message: 'Draft document deleted successfully' };
}

/**
 * Get all invoices for CLIENT
 */
export async function getClientInvoices(userId: string, firmId: string) {
  return await (prisma as any).invoice.findMany({
    where: {
      userId,
      firmId,
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      dueDate: true,
      totalAmount: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get invoice by ID (must belong to client)
 */
export async function getClientInvoiceById(invoiceId: string, userId: string, firmId: string) {
  const invoice = await (prisma as any).invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
      firmId,
    },
    include: {
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          amount: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          paymentStatus: true,
        },
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount || 0),
    totalAmount: Number(invoice.totalAmount),
    status: invoice.status,
    items: invoice.items.map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    payments: invoice.payments.map((payment: any) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate.toISOString(),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
    })),
  };
}

/**
 * Record payment for invoice
 */
export async function recordClientPayment(
  invoiceId: string,
  userId: string,
  firmId: string,
  amount: number,
  paymentMethod: string
) {
  // Verify invoice belongs to user
  const invoice = await (prisma as any).invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
      firmId,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Create payment record
  const payment = await (prisma as any).payment.create({
    data: {
      invoiceId,
      amount: amount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      paymentStatus: 'COMPLETED',
      transactionId: `TXN-${Date.now()}`,
    },
  });

  // Update invoice status if fully paid
  const totalPaid = await (prisma as any).payment.aggregate({
    where: {
      invoiceId,
      paymentStatus: 'COMPLETED',
    },
    _sum: {
      amount: true,
    },
  });

  const totalPaidAmount = Number(totalPaid?._sum?.amount || 0);
  const invoiceTotal = Number(invoice.totalAmount);

  if (totalPaidAmount >= invoiceTotal) {
    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
      },
    });
  }

  return payment;
}

/**
 * Get CLIENT profile
 */
export async function getClientProfile(userId: string, firmId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      role: 'CLIENT' as any,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    pan: (user as any).pan || null,
    aadhar: (user as any).aadhar || null,
    address: (user as any).address || null,
  };
}

/**
 * Update CLIENT profile
 */
export async function updateClientProfile(userId: string, firmId: string, userData: any) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      role: 'CLIENT' as any,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: userData.name,
      phone: userData.phone,
      pan: userData.pan,
      aadhar: userData.aadhar,
      address: userData.address,
    } as any,
  });

  return updated;
}

