import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../../utils/email';
import crypto from 'crypto';

/**
 * Get dashboard statistics for Project Manager
 * Only shows data for their managed clients
 */
export async function getCaDashboard(_projectManagerId: string, firmId: string) {
  // Get client count (ALL clients in firm - PM has full access)
  const clientCount = await prisma.client.count({
    where: {
      firmId,
      isActive: true,
      deletedAt: null,
    },
  });

  // Get service stats (ALL in firm)
  const activeServicesCount = await prisma.service.count({
    where: {
      firmId,
      status: {
        in: ['IN_PROGRESS', 'UNDER_REVIEW'],
      },
    },
  });

  const pendingServicesCount = await prisma.service.count({
    where: {
      firmId,
      status: 'PENDING',
    },
  });

  // Get pending invoices count (ALL in firm)
  const pendingInvoicesCount = await prisma.invoice.count({
    where: {
      firmId,
      status: {
        in: ['DRAFT', 'SENT'],
      },
    },
  });

  // Get team member count (ALL in firm)
  const teamMemberCount = await prisma.teamMember.count({
    where: {
      firmId,
      isActive: true,
      deletedAt: null,
    },
  });

  // Get recent clients (last 5 - ALL in firm)
  const recentClients = await prisma.client.findMany({
    where: {
      firmId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      _count: {
        select: {
          services: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  // Get recent services (last 5 - ALL in firm)
  const recentServices = await prisma.service.findMany({
    where: {
      firmId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      client: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  return {
    userCount: clientCount,
    teamMemberCount,
    activeServicesCount,
    pendingServicesCount,
    pendingInvoicesCount,
    recentUsers: recentClients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      servicesCount: client._count.services,
      isActive: client.isActive,
    })),
    recentServices: recentServices.map((service) => ({
      id: service.id,
      title: service.title,
      status: service.status,
      user: { name: service.client.name },
      dueDate: service.dueDate?.toISOString() || null,
    })),
  };
}

/**
 * Get all clients in the firm (PM has access to all clients in hierarchy)
 */
export async function getCaCustomers(_projectManagerId: string, firmId: string) {
  const clients = await prisma.client.findMany({
    where: {
      firmId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      lastLoginAt: true,
      _count: {
        select: {
          services: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    isActive: client.isActive,
    servicesCount: client._count.services,
    lastLoginAt: client.lastLoginAt?.toISOString() || null,
  }));
}

/**
 * Get client by ID (PM has access to all clients in firm)
 */
export async function getCaCustomerById(clientId: string, _projectManagerId: string, firmId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
      deletedAt: null,
    },
    include: {
      services: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          dueDate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
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
    isActive: client.isActive,
    lastLoginAt: client.lastLoginAt?.toISOString() || null,
    createdAt: client.createdAt.toISOString(),
    services: client.services.map((service) => ({
      id: service.id,
      title: service.title,
      type: service.type,
      status: service.status,
      dueDate: service.dueDate?.toISOString() || null,
    })),
  };
}

/**
 * Create client under this Project Manager
 */
export async function createCaCustomer(projectManagerId: string, firmId: string, userData: any) {
  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64').substring(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const client = await prisma.client.create({
    data: {
      firmId,
      managedBy: projectManagerId,
      createdBy: projectManagerId,
      createdByRole: 'PROJECT_MANAGER',
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      phone: userData.phone || null,
      pan: userData.pan || null,
      aadhar: userData.aadhar || null,
      address: userData.address || null,
      emailVerified: true,
      mustChangePassword: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Send welcome email
  await sendWelcomeEmail(
    client.email,
    tempPassword,
    client.name,
    'CLIENT'
  );

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    role: 'CLIENT',
  };
}

/**
 * Update client (PM has access to all clients in firm)
 */
export async function updateCaCustomer(clientId: string, _projectManagerId: string, firmId: string, userData: any) {
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
      email: userData.email,
      phone: userData.phone,
      pan: userData.pan,
      aadhar: userData.aadhar,
      address: userData.address,
    },
  });

  return updated;
}

/**
 * Delete client (soft delete - PM has access to all clients in firm)
 */
export async function deleteCaCustomer(clientId: string, projectManagerId: string, firmId: string) {
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

  await prisma.client.update({
    where: { id: clientId },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: projectManagerId,
    },
  });

  return { success: true };
}

/**
 * Get all services in the firm (PM has access to all services in hierarchy)
 */
export async function getCaServices(_projectManagerId: string, firmId: string, filters: any = {}) {
  const where: any = {
    firmId,
    deletedAt: null, // Exclude deleted services (they appear in trash)
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  return await prisma.service.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get documents in the firm (PM can see TM and Client documents only - hierarchy based)
 */
export async function getCaDocuments(_projectManagerId: string, firmId: string) {
  // PM can see documents uploaded by Team Members and Clients (below them in hierarchy)
  return await prisma.document.findMany({
    where: {
      firmId,
      isDeleted: false,
      // Only documents from roles below PM in hierarchy
      OR: [
        { uploadedByRole: 'TEAM_MEMBER' },
        { uploadedByRole: 'CLIENT' },
        { uploadedByRole: null }, // Legacy documents without role
      ],
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
    orderBy: {
      uploadedAt: 'desc',
    },
  });
}

/**
 * Get all invoices in the firm (PM has access to all invoices)
 */
export async function getCaInvoices(_projectManagerId: string, firmId: string) {
  return await prisma.invoice.findMany({
    where: {
      firmId,
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
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get Project Manager profile
 */
export async function getCaProfile(projectManagerId: string, firmId: string) {
  const pm = await prisma.projectManager.findFirst({
    where: {
      id: projectManagerId,
      firmId,
      deletedAt: null,
    },
  });

  if (!pm) {
    throw new Error('Project Manager not found');
  }

  return pm;
}

/**
 * Update Project Manager profile
 */
export async function updateCaProfile(projectManagerId: string, firmId: string, pmData: any) {
  const pm = await prisma.projectManager.findFirst({
    where: {
      id: projectManagerId,
      firmId,
      deletedAt: null,
    },
  });

  if (!pm) {
    throw new Error('Project Manager not found');
  }

  const updated = await prisma.projectManager.update({
    where: { id: projectManagerId },
    data: {
      name: pmData.name,
      phone: pmData.phone,
      address: pmData.address,
      gstin: pmData.gstin,
      pan: pmData.pan,
    },
  });

  return updated;
}

/**
 * Get client documents grouped by client for PM dashboard (all clients in firm)
 */
export async function getClientDocuments(_projectManagerId: string, firmId: string) {
  // Get all clients in the firm
  const clients = await prisma.client.findMany({
    where: {
      firmId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Get document counts by client and type
  const result = [];

  for (const client of clients) {
    const documents = await prisma.document.findMany({
      where: {
        clientId: client.id,
        isDeleted: false,
      },
      select: {
        id: true,
        documentType: true,
        status: true,
      },
    });

    // Group by document type
    const typeCount: Record<string, number> = {};
    documents.forEach(doc => {
      const type = doc.documentType || 'OTHER';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const documentTypes = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
    }));

    result.push({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      documentTypes,
    });
  }

  return result;
}

