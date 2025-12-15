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
 * Updated for new schema - uses clientId instead of userId
 */
export async function getAllInvoices(userContext: {
  id: string;
  role: string;
  firmId: string;
}, filters: {
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const where: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    // PM can see invoices for clients they manage
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
    // Client can only see their own invoices
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    // Team member can see invoices of assigned clients
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map((a) => a.clientId) };
  }
  // ADMIN and SUPER_ADMIN can see all

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
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

  return await prisma.invoice.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
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
  }
) {
  const where: any = {
    id,
    firmId: userContext.firmId,
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

  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
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
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return invoice;
}

/**
 * Create invoice (ADMIN/PM only)
 */
export async function createInvoice(
  firmId: string,
  _creatorId: string,
  _creatorRole: string,
  invoiceData: {
    clientId: string;
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
  // Verify client exists
  const client = await prisma.client.findFirst({
    where: {
      id: invoiceData.clientId,
      firmId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

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
        clientId: invoiceData.clientId,
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
      },
    });

    // Create invoice items
    const items = await Promise.all(
      invoiceData.items.map((item) =>
        tx.invoiceItem.create({
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
 * Update invoice (ADMIN/PM only)
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
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // If items are provided, recalculate totals
  let totals = {
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate || 18),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
  };

  if (invoiceData.items) {
    totals = calculateInvoiceTotals(invoiceData.items, invoiceData.discount || 0);
  }

  // Update invoice and items in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update invoice
    const updateData: any = {
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
    };

    if (invoiceData.invoiceDate) {
      updateData.invoiceDate = new Date(invoiceData.invoiceDate);
    }
    if (invoiceData.dueDate) {
      updateData.dueDate = new Date(invoiceData.dueDate);
    }
    if (invoiceData.discount !== undefined) {
      updateData.discount = invoiceData.discount;
    }
    if (invoiceData.notes !== undefined) {
      updateData.notes = invoiceData.notes;
    }

    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: updateData,
    });

    // Update items if provided
    if (invoiceData.items) {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Create new items
      await Promise.all(
        invoiceData.items.map((item) =>
          tx.invoiceItem.create({
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
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      client: {
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

  // TODO: Send email notification to client
  // await sendInvoiceEmail(invoice.client.email, invoice.invoiceNumber, ...);

  return updated;
}

/**
 * Get invoice PDF data for generation
 */
export async function getInvoicePDFData(id: string, firmId: string) {
  const invoice = await prisma.invoice.findFirst({
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
      client: {
        select: {
          name: true,
          email: true,
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

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toLocaleDateString('en-IN'),
    dueDate: invoice.dueDate.toLocaleDateString('en-IN'),
    firmName: invoice.firm?.name || '',
    firmAddress: invoice.firm?.address || '',
    firmGSTIN: invoice.firm?.gstin || undefined,
    clientName: invoice.client?.name || '',
    clientEmail: invoice.client?.email || '',
    clientAddress: invoice.client?.address || '',
    clientGSTIN: invoice.client?.gstin || undefined,
    clientPAN: invoice.client?.pan || undefined,
    items: (invoice.items || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      sacCode: '998314', // Standard SAC code
      amount: Number(item.amount),
    })),
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    discount: Number(invoice.discount || 0),
    totalAmount: Number(invoice.totalAmount),
    paymentTerms: invoice.notes || 'Payment due within 30 days of invoice date.',
  };
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(firmId: string, userContext?: { id: string; role: string }) {
  const where: any = { firmId };

  // Apply role filtering
  if (userContext) {
    if (userContext.role === 'PROJECT_MANAGER') {
      const managedClients = await prisma.client.findMany({
        where: { firmId, managedBy: userContext.id, deletedAt: null },
        select: { id: true },
      });
      where.clientId = { in: managedClients.map((c) => c.id) };
    } else if (userContext.role === 'CLIENT') {
      where.clientId = userContext.id;
    }
  }

  const [draft, sent, paid, overdue, cancelled] = await Promise.all([
    prisma.invoice.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.invoice.count({ where: { ...where, status: 'SENT' } }),
    prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
    prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
    prisma.invoice.count({ where: { ...where, status: 'CANCELLED' } }),
  ]);

  // Calculate total amount pending
  const pendingInvoices = await prisma.invoice.aggregate({
    where: { ...where, status: { in: ['SENT', 'OVERDUE'] } },
    _sum: { totalAmount: true },
  });

  return {
    draft,
    sent,
    paid,
    overdue,
    cancelled,
    total: draft + sent + paid + overdue,
    pendingAmount: Number(pendingInvoices._sum.totalAmount || 0),
  };
}
