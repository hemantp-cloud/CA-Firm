import prisma from '../../shared/utils/prisma';
import { InvoiceStatus } from '@prisma/client';

/**
 * Generate next invoice number (INV-YYYY-XXXXX)
 */
export async function generateInvoiceNumber(firmId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the latest invoice for this year
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      firmId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let sequence = 1;
  if (latestInvoice) {
    // Extract sequence number from latest invoice
    const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }

  // Format sequence as 5-digit number (00001, 00002, etc.)
  const sequenceStr = sequence.toString().padStart(5, '0');
  return `${prefix}${sequenceStr}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(items: Array<{
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}>, discount: number = 0) {
  let subtotal = 0;

  items.forEach((item) => {
    subtotal += Number(item.quantity) * Number(item.unitPrice);
  });

  // Apply discount
  const subtotalAfterDiscount = subtotal - discount;

  // Calculate tax (default 18% GST)
  const defaultTaxRate = 18;
  const taxRate = items[0]?.taxRate ? Number(items[0].taxRate) : defaultTaxRate;
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100;

  const totalAmount = subtotalAfterDiscount + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    taxRate: Number(taxRate.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Get all invoices with role-based filtering
 */
export async function getAllInvoices(userContext: {
  id: string;
  role: string;
  firmId: string;
  clientId: string | null;
}, filters: {
  status?: InvoiceStatus;
  userId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const where: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'CLIENT') {
    where.clientId = userContext.clientId;
  } else if (userContext.role === 'USER') {
    where.userId = userContext.id;
  }

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.invoiceDate = {};
    if (filters.dateFrom) {
      where.invoiceDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.invoiceDate.lte = new Date(filters.dateTo);
    }
  }

  return await (prisma as any).invoice.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get invoice by ID with ownership check
 */
export async function getInvoiceById(
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
    where.clientId = userContext.clientId;
  } else if (userContext.role === 'USER') {
    where.userId = userContext.id;
  }

  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
      items: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  } as any);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return invoice;
}

/**
 * Create invoice (CA only)
 */
export async function createInvoice(
  firmId: string,
  invoiceData: {
    userId: string;
    clientId?: string;
    serviceId?: string;
    invoiceDate: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
    }>;
    discount?: number;
    notes?: string;
  }
) {
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(firmId);

  // Calculate totals
  const totals = calculateInvoiceTotals(invoiceData.items, invoiceData.discount || 0);

  // Create invoice and items in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    // Create invoice
    const newInvoice = await tx.invoice.create({
      data: {
        firmId,
        userId: invoiceData.userId,
        clientId: invoiceData.clientId || null,
        serviceId: invoiceData.serviceId || null,
        invoiceNumber,
        invoiceDate: new Date(invoiceData.invoiceDate),
        dueDate: new Date(invoiceData.dueDate),
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        discount: invoiceData.discount || 0,
        totalAmount: totals.totalAmount,
        status: 'DRAFT' as InvoiceStatus,
        notes: invoiceData.notes || null,
      } as any,
    });

    // Create invoice items
    const items = await Promise.all(
      invoiceData.items.map((item) =>
        (tx as any).invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || totals.taxRate,
            amount: Number(item.quantity) * Number(item.unitPrice),
          },
        })
      )
    );

    return { invoice: newInvoice, items };
  });

  return invoice.invoice;
}

/**
 * Update invoice (CA only)
 */
export async function updateInvoice(
  id: string,
  firmId: string,
  invoiceData: {
    invoiceDate?: string;
    dueDate?: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
    }>;
    discount?: number;
    notes?: string;
  }
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      items: true,
    },
  } as any);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // If items are provided, recalculate totals
  const invoiceWithTaxRate = invoice as any;
  let totals = {
    subtotal: Number(invoiceWithTaxRate.subtotal),
    taxRate: Number(invoiceWithTaxRate.taxRate || 18),
    taxAmount: Number(invoiceWithTaxRate.taxAmount),
    totalAmount: Number(invoiceWithTaxRate.totalAmount),
  };

  if (invoiceData.items) {
    totals = calculateInvoiceTotals(invoiceData.items, invoiceData.discount || 0);
  }

  // Update invoice and items in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update invoice
    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: {
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : undefined,
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discount: invoiceData.discount !== undefined ? invoiceData.discount : undefined,
        totalAmount: totals.totalAmount,
        notes: invoiceData.notes !== undefined ? invoiceData.notes : undefined,
      } as any,
    });

    // Update items if provided
    if (invoiceData.items) {
      // Delete existing items
      await (tx as any).invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Create new items
      await Promise.all(
        invoiceData.items.map((item) =>
          (tx as any).invoiceItem.create({
            data: {
              invoiceId: id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate || totals.taxRate,
              amount: Number(item.quantity) * Number(item.unitPrice),
            },
          })
        )
      );
    }

    return updatedInvoice;
  });

  return updated;
}

/**
 * Mark invoice as sent
 */
export async function markInvoiceAsSent(id: string, firmId: string) {
  const invoice = await (prisma as any).invoice.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Update status
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: 'SENT' as InvoiceStatus,
    },
  });

  // TODO: Send email notification
  // await sendInvoiceEmail(invoice.user.email, invoice.invoiceNumber, ...);

  return updated;
}

/**
 * Get invoice PDF data for generation
 */
export async function getInvoicePDFData(id: string, firmId: string) {
  const invoice = await (prisma as any).invoice.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      firm: {
        select: {
          name: true,
          address: true,
          gstin: true,
          pan: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      client: {
        select: {
          name: true,
          address: true,
          gstin: true,
          pan: true,
        },
      },
      items: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Type assertion for invoice with relations
  const invoiceWithRelations = invoice as any;

  return {
    invoiceNumber: invoiceWithRelations.invoiceNumber,
    invoiceDate: invoiceWithRelations.invoiceDate.toLocaleDateString('en-IN'),
    dueDate: invoiceWithRelations.dueDate.toLocaleDateString('en-IN'),
    firmName: invoiceWithRelations.firm?.name || '',
    firmAddress: invoiceWithRelations.firm?.address || '',
    firmGSTIN: invoiceWithRelations.firm?.gstin || undefined,
    clientName: invoiceWithRelations.user?.name || '',
    clientAddress: invoiceWithRelations.client?.address || '', // Use client address if available, User doesn't have address
    clientGSTIN: invoiceWithRelations.client?.gstin || undefined,
    clientPAN: invoiceWithRelations.client?.pan || undefined,
    items: (invoiceWithRelations.items || []).map((item: any) => ({
      description: item.description,
      sacCode: '998314', // Standard SAC code
      amount: Number(item.amount),
    })),
    subtotal: Number(invoiceWithRelations.subtotal),
    taxAmount: Number(invoiceWithRelations.taxAmount),
    totalAmount: Number(invoiceWithRelations.totalAmount),
    paymentTerms: invoiceWithRelations.notes || 'Payment due within 30 days of invoice date.',
  };
}

