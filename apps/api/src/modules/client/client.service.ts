import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../../utils/email';
import crypto from 'crypto';

/**
 * Get dashboard statistics for CLIENT
 * Only shows data for their users
 */
export async function getClientDashboard(clientId: string, firmId: string) {
  // Get user count (only USER role under this client)
  const userCount = await prisma.user.count({
    where: {
      firmId,
      clientId,
      role: 'USER' as any,
      isActive: true,
    },
  });

  // Get service stats (only for their users)
  const activeServicesCount = await prisma.service.count({
    where: {
      firmId,
      clientId,
      status: {
        in: ['IN_PROGRESS', 'UNDER_REVIEW'] as any,
      },
    },
  });

  const pendingServicesCount = await prisma.service.count({
    where: {
      firmId,
      clientId,
      status: 'PENDING' as any,
    },
  });

  // Get pending invoices count
  const pendingInvoicesCount = await prisma.invoice.count({
    where: {
      firmId,
      clientId,
      status: {
        in: ['DRAFT', 'SENT'] as any,
      },
    },
  });

  // Get recent users (last 5)
  const recentUsers = await prisma.user.findMany({
    where: {
      firmId,
      clientId,
      role: 'USER' as any,
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

  // Get recent services (last 5)
  const recentServices = await prisma.service.findMany({
    where: {
      firmId,
      clientId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      user: {
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
    userCount,
    activeServicesCount,
    pendingServicesCount,
    pendingInvoicesCount,
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      servicesCount: user._count.services,
      isActive: user.isActive,
    })),
    recentServices: recentServices.map((service) => ({
      id: service.id,
      title: service.title,
      status: service.status,
      user: service.user,
      dueDate: service.dueDate?.toISOString() || null,
    })),
  };
}

/**
 * Get all users for a CLIENT (only USER role)
 */
export async function getClientUsers(clientId: string, firmId: string) {
  const users = await prisma.user.findMany({
    where: {
      firmId,
      clientId,
      role: 'USER' as any,
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

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    servicesCount: user._count.services,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  }));
}

/**
 * Get user by ID (must belong to client)
 */
export async function getClientUserById(userId: string, clientId: string, firmId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      clientId,
      role: 'USER' as any,
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
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
    services: user.services.map((service) => ({
      id: service.id,
      title: service.title,
      type: service.type,
      status: service.status,
      dueDate: service.dueDate?.toISOString() || null,
    })),
  };
}

/**
 * Create user under CLIENT (role: USER)
 */
export async function createClientUser(clientId: string, firmId: string, userData: any) {
  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64').substring(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      firmId,
      clientId,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      phone: userData.phone || null,
      role: 'USER' as any,
      pan: userData.pan || null,
      aadhar: userData.aadhar || null,
      address: userData.address || null,
      emailVerified: true,
      mustChangePassword: true,
    } as any,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Send welcome email
  await sendWelcomeEmail(
    user.email,
    tempPassword,
    user.name,
    user.role
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Update user (must belong to client)
 */
export async function updateClientUser(userId: string, clientId: string, firmId: string, userData: any) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      clientId,
      role: 'USER' as any,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      pan: userData.pan,
      aadhar: userData.aadhar,
      address: userData.address,
    } as any,
  });

  return updated;
}

/**
 * Delete user (soft delete - must belong to client)
 */
export async function deleteClientUser(userId: string, clientId: string, firmId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      clientId,
      role: 'USER' as any,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
    },
  });

  return { success: true };
}

/**
 * Get CLIENT's users' services
 */
export async function getClientServices(clientId: string, firmId: string, filters: any = {}) {
  const where: any = {
    firmId,
    clientId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  return await prisma.service.findMany({
    where,
    include: {
      user: {
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
 * Get CLIENT's users' documents
 */
export async function getClientDocuments(clientId: string, firmId: string) {
  // Get all users under this client
  const userIds = await prisma.user.findMany({
    where: {
      firmId,
      clientId,
      role: 'USER' as any,
    },
    select: {
      id: true,
    },
  });

  const userIdArray = userIds.map((u) => u.id);

  return await prisma.document.findMany({
    where: {
      firmId,
      userId: {
        in: userIdArray,
      },
    },
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
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });
}

/**
 * Get CLIENT's users' invoices
 */
export async function getClientInvoices(clientId: string, firmId: string) {
  return await prisma.invoice.findMany({
    where: {
      firmId,
      clientId,
    },
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get CLIENT profile
 */
export async function getClientProfile(clientId: string, firmId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  return client;
}

/**
 * Update CLIENT profile
 */
export async function updateClientProfile(clientId: string, firmId: string, clientData: any) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      gstin: clientData.gstin,
      pan: clientData.pan,
      contactPerson: clientData.contactPerson,
    } as any,
  });

  return updated;
}

