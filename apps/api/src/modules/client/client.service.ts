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

  return await (prisma as any).document.findMany({
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

  return document;
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

