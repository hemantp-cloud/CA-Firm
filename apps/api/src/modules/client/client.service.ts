import prisma from '../../shared/utils/prisma';

/**
 * Get dashboard statistics for CLIENT
 */
export async function getClientDashboard(clientId: string, firmId: string) {
  // Get active services count for this client
  const activeServicesCount = await prisma.service.count({
    where: {
      clientId,
      firmId,
      status: {
        in: ['IN_PROGRESS', 'UNDER_REVIEW'],
      },
    },
  });

  // Get pending invoices count
  const pendingInvoicesCount = await prisma.invoice.count({
    where: {
      clientId,
      firmId,
      status: {
        in: ['DRAFT', 'SENT', 'OVERDUE'],
      },
    },
  });

  // Get active services (last 5)
  const activeServices = await prisma.service.findMany({
    where: {
      clientId,
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
  const recentDocuments = await prisma.document.findMany({
    where: {
      clientId,
      firmId,
      isDeleted: false,
    },
    select: {
      id: true,
      fileName: true,
      documentType: true,
      uploadedAt: true,
      teamMemberId: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    take: 5,
  });

  // Get pending invoices (last 3)
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      clientId,
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
    activeServices: activeServices.map((service) => ({
      id: service.id,
      title: service.title,
      status: service.status,
      type: service.type,
      dueDate: service.dueDate?.toISOString() || null,
    })),
    recentDocuments: recentDocuments.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt.toISOString(),
      isFromCA: !!doc.teamMemberId, // If uploaded by team member, it's from CA side
    })),
    pendingInvoices: pendingInvoices.map((invoice) => ({
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
export async function getClientServices(clientId: string, firmId: string) {
  return await prisma.service.findMany({
    where: {
      clientId,
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
export async function getClientServiceById(serviceId: string, clientId: string, firmId: string) {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      clientId,
      firmId,
    },
    include: {
      documents: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          fileName: true,
          documentType: true,
          uploadedAt: true,
          teamMemberId: true,
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
    documents: service.documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt.toISOString(),
      isFromCA: !!doc.teamMemberId,
    })),
  };
}

/**
 * Get all documents for CLIENT
 */
export async function getClientDocuments(clientId: string, firmId: string, filters: any = {}) {
  const where: any = {
    clientId,
    firmId,
    isDeleted: false,
  };

  if (filters.type) {
    where.documentType = filters.type;
  }

  const documents = await prisma.document.findMany({
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
  return documents.map((doc) => ({
    ...doc,
    fileSize: doc.fileSize?.toString() || '0',
  }));
}

/**
 * Upload document for CLIENT
 */
export async function uploadClientDocument(
  clientId: string,
  firmId: string,
  fileData: any,
  documentType: string,
  serviceId: string | null,
  description: string | null
) {
  // In production, save file to storage (S3, local storage, etc.)
  const document = await prisma.document.create({
    data: {
      firmId,
      clientId,
      serviceId: serviceId || null,
      fileName: fileData.originalname || fileData.name || 'document.pdf',
      fileType: fileData.mimetype || 'application/pdf',
      fileSize: BigInt(fileData.size || 0),
      storagePath: `/uploads/${clientId}/${Date.now()}-${fileData.originalname || fileData.name}`,
      documentType: documentType as any,
      description: description || null,
    },
  });

  return {
    ...document,
    fileSize: document.fileSize.toString(),
  };
}

/**
 * Upload document as DRAFT (Phase 1 of two-stage upload)
 */
export async function uploadDraftDocument(
  clientId: string,
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
  const tempPath = getTempFilePath(clientId, documentId, fileData.originalname || fileData.name);

  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  await fs.mkdir(tempDir, { recursive: true });

  // Save uploaded file to temp storage
  if (fileData.buffer) {
    await fs.writeFile(tempPath, fileData.buffer);
  } else {
    throw new Error('No file buffer available');
  }

  // Create document record with DRAFT status
  const document = await prisma.document.create({
    data: {
      firmId,
      clientId,
      serviceId: serviceId || null,
      fileName: fileData.originalname || fileData.name || 'document.pdf',
      fileType: fileData.mimetype || 'application/pdf',
      fileSize: BigInt(fileData.size || 0),
      storagePath: tempPath,
      documentType: documentType as any,
      description: description || null,
      uploadStatus: 'DRAFT',
    },
  });

  return {
    ...document,
    fileSize: document.fileSize.toString(),
  };
}

/**
 * Submit draft documents (Phase 2 of two-stage upload)
 */
export async function submitDocuments(
  clientId: string,
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

  // Get client details for folder name
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  });

  if (!client) {
    throw new Error('Client not found');
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

    if (document.clientId !== clientId) {
      throw new Error(`Unauthorized access to document ${documentId}`);
    }

    if (document.uploadStatus !== 'DRAFT') {
      throw new Error(`Document ${documentId} is not in DRAFT status`);
    }

    // Check if file exists at the stored path
    const fileExistsAtPath = await fileExists(document.storagePath);

    if (!fileExistsAtPath) {
      await prisma.document.delete({
        where: { id: documentId },
      });
      throw new Error(`File not found for document ${document.fileName}. Please re-upload the document.`);
    }

    // Create client folder structure
    const documentType = document.documentType || 'OTHER';
    await createClientFolder(client.name, documentType);

    // Get permanent file path
    const permanentPath = getPermanentFilePath(client.name, documentType, document.fileName);
    const folderPath = getFolderPath(client.name, documentType);

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
      userId: clientId,
      userType: 'CLIENT',
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

  // Broadcast SSE event to Admin and PM users
  const sseService = (await import('../sse/sse.service')).default;
  sseService.broadcastToRoles(firmId, ['ADMIN', 'PROJECT_MANAGER'], 'documents-submitted', {
    clientName: client.name,
    clientId: clientId,
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
  clientId: string,
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

  if (document.clientId !== clientId) {
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
export async function getClientInvoices(clientId: string, firmId: string) {
  return await prisma.invoice.findMany({
    where: {
      clientId,
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
export async function getClientInvoiceById(invoiceId: string, clientId: string, firmId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId,
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
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    payments: invoice.payments.map((payment) => ({
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
  clientId: string,
  firmId: string,
  amount: number,
  paymentMethod: string
) {
  // Verify invoice belongs to client
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId,
      firmId,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: amount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod as any,
      paymentStatus: 'COMPLETED',
      transactionRef: `TXN-${Date.now()}`,
    },
  });

  // Update invoice status if fully paid
  const totalPaid = await prisma.payment.aggregate({
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
    await prisma.invoice.update({
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
export async function getClientProfile(clientId: string, firmId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    pan: client.pan || null,
    aadhar: client.aadhar || null,
    address: client.address || null,
    city: client.city || null,
    state: client.state || null,
    pincode: client.pincode || null,
    companyName: client.companyName || null,
    gstin: client.gstin || null,
  };
}

/**
 * Update CLIENT profile
 */
export async function updateClientProfile(clientId: string, firmId: string, userData: any) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      name: userData.name,
      phone: userData.phone,
      pan: userData.pan,
      aadhar: userData.aadhar,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      pincode: userData.pincode,
    },
  });

  return updated;
}
