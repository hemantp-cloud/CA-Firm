import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../../utils/email';
import crypto from 'crypto';

/**
 * Get dashboard statistics for CA
 */
export async function getDashboardStats(firmId: string) {
  // Get client count
  const clientCount = await prisma.client.count({
    where: {
      firmId,
      isActive: true,
    },
  });

  // Get user count (only USER role, not CLIENT)
  const userCount = await prisma.user.count({
    where: {
      firmId,
      role: 'USER' as any,
      isActive: true,
    },
  });

  // Get service stats
  const activeServicesCount = await prisma.service.count({
    where: {
      firmId,
      status: {
        in: ['IN_PROGRESS', 'UNDER_REVIEW'] as any,
      },
    },
  });

  const pendingServicesCount = await prisma.service.count({
    where: {
      firmId,
      status: 'PENDING' as any,
    },
  });

  // Get revenue this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueThisMonth = await (prisma as any).payment.aggregate({
    where: {
      invoice: {
        firmId,
      },
      paymentStatus: 'COMPLETED',
      paymentDate: {
        gte: startOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Get overdue invoices count
  const overdueInvoicesCount = await prisma.invoice.count({
    where: {
      firmId,
      status: 'OVERDUE',
    },
  });

  // Get services by status
  const servicesByStatus = await prisma.service.groupBy({
    by: ['status'],
    where: {
      firmId,
    },
    _count: {
      id: true,
    },
  });

  // Get revenue trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const payments = await (prisma as any).payment.findMany({
    where: {
      invoice: {
        firmId,
      },
      paymentStatus: 'COMPLETED',
      paymentDate: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      amount: true,
      paymentDate: true,
    },
  });

  // Group by month
  const revenueByMonth: Record<string, number> = {};
  payments.forEach((payment: any) => {
    const month = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.amount);
  });

  // Convert to array format
  const revenueTrend = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Get services by type
  const servicesByType = await (prisma as any).service.groupBy({
    by: ['type'],
    where: {
      firmId,
    },
    _count: {
      id: true,
    },
  });

  // Get recent activity (last 10)
  const recentActivity = await (prisma as any).activityLog.findMany({
    where: {
      firmId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityName: true,
      user: {
        select: {
          name: true,
        },
      },
      createdAt: true,
    },
  });

  return {
    clientCount,
    userCount,
    activeServicesCount,
    pendingServicesCount,
    revenueThisMonth: Number(revenueThisMonth?._sum?.amount || 0),
    overdueInvoicesCount,
    servicesByStatus: servicesByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    revenueTrend,
    servicesByType: servicesByType.map((item: any) => ({
      type: item.type,
      count: item._count?.id || 0,
    })),
    recentActivity: recentActivity.map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      entityName: activity.entityName,
      userName: activity.user?.name || 'System',
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

/**
 * Get all clients with user count
 */
export async function getAllClients(firmId: string) {
  // Fetch clients
  const clients = await (prisma as any).client.findMany({
    where: {
      firmId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get user counts for all clients in one query
  const userCounts = await (prisma as any).user.groupBy({
    by: ['clientId'],
    where: {
      clientId: {
        in: clients.map((c: any) => c.id),
      },
      firmId,
    },
    _count: {
      id: true,
    },
  });

  // Create a map of clientId -> count
  const countMap = new Map(
    userCounts.map((item: any) => [item.clientId, item._count?.id || 0])
  );

  // Combine clients with their user counts
  return clients.map((client: any) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    usersCount: countMap.get(client.id) || 0,
    isActive: client.isActive,
  }));
}

/**
 * Get client by ID with users
 */
export async function getClientById(clientId: string, firmId: string) {
  const client = await (prisma as any).client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
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
    address: client.address,
    city: client.city || null,
    state: client.state || null,
    pincode: client.pincode || null,
    gstin: client.gstin,
    pan: client.pan,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
    users: client.users || [],
  };
}

/**
 * Create client and CLIENT user
 */
export async function createClient(firmId: string, clientData: any) {
  // Check if client with this email already exists
  const existingClient = await prisma.client.findFirst({
    where: {
      email: clientData.email,
    },
  });

  if (existingClient) {
    if (existingClient.isActive) {
      throw new Error('Email already in use by an active client');
    } else {
      // Throw a custom error object/string that the controller can parse
      // Or better, throw an error with a specific message format
      const error = new Error('This email belongs to an inactive client. Please reactivate the existing client instead of creating a new one.');
      (error as any).code = 'INACTIVE_CLIENT_EXISTS';
      (error as any).existingClientId = existingClient.id;
      throw error;
    }
  }

  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64').substring(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Create client and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create client
    const client = await tx.client.create({
      data: {
        firmId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        pincode: clientData.pincode || null,
        gstin: clientData.gstin || null,
        pan: clientData.pan || null,
      } as any,
    });

    // Create CLIENT user (use client name or contactPerson if provided)
    const userName = clientData.contactPerson || clientData.name;
    const user = await tx.user.create({
      data: {
        firmId,
        clientId: client.id,
        email: clientData.email,
        password: hashedPassword,
        name: userName,
        role: 'CLIENT',
        emailVerified: true,
        mustChangePassword: true,
      } as any,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return { client, user, tempPassword };
  });

  // Send welcome email
  await sendWelcomeEmail(
    result.user.email,
    result.tempPassword,
    result.user.name,
    'CLIENT'
  );

  const clientResult = result.client as any;
  return {
    id: clientResult.id,
    name: clientResult.name,
    email: clientResult.email,
    phone: clientResult.phone,
    address: clientResult.address,
    city: clientResult.city || null,
    state: clientResult.state || null,
    pincode: clientResult.pincode || null,
    gstin: clientResult.gstin,
    pan: clientResult.pan,
    isActive: clientResult.isActive,
  };
}

/**
 * Update client
 */
export async function updateClient(clientId: string, firmId: string, clientData: any) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const updateData: any = {};

  if (clientData.name !== undefined) updateData.name = clientData.name;
  if (clientData.email !== undefined) updateData.email = clientData.email;
  if (clientData.phone !== undefined) updateData.phone = clientData.phone || null;
  if (clientData.address !== undefined) updateData.address = clientData.address || null;
  if (clientData.city !== undefined) updateData.city = clientData.city || null;
  if (clientData.state !== undefined) updateData.state = clientData.state || null;
  if (clientData.pincode !== undefined) updateData.pincode = clientData.pincode || null;
  if (clientData.gstin !== undefined) updateData.gstin = clientData.gstin || null;
  if (clientData.pan !== undefined) updateData.pan = clientData.pan || null;

  // Handle isActive changes
  if (clientData.isActive !== undefined) {
    updateData.isActive = clientData.isActive;

    // If activating/deactivating client, also update users
    if (clientData.isActive !== client.isActive) {
      await (prisma as any).user.updateMany({
        where: {
          clientId,
        },
        data: {
          isActive: clientData.isActive,
        },
      });
    }
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  });

  return updated;
}

/**
 * Reactivate client
 */
export async function reactivateClient(clientId: string, firmId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  if (client.isActive) {
    throw new Error('Client is already active');
  }

  // Reactivate client
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      isActive: true,
    },
  });

  // Reactivate associated users
  await (prisma as any).user.updateMany({
    where: {
      clientId,
    },
    data: {
      isActive: true,
    },
  });

  return updatedClient;
}

/**
 * Delete client (soft delete)
 */
export async function deleteClient(clientId: string, firmId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      isActive: false,
    },
  });

  // Also deactivate associated users
  await (prisma as any).user.updateMany({
    where: {
      clientId,
    },
    data: {
      isActive: false,
    },
  });

  return { success: true };
}

/**
 * Get all users with filters
 */
export async function getAllUsers(firmId: string, filters: {
  role?: string;
  clientId?: string;
  isActive?: boolean;
}) {
  const where: any = {
    firmId,
    role: {
      in: ['CLIENT', 'USER'], // CA cannot see other CAs
    },
  };

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.clientId) {
    (where as any).clientId = filters.clientId;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const users = await (prisma as any).user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      clientId: true,
      client: {
        select: {
          name: true,
        },
      },
      isActive: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    clientId: user.clientId,
    clientName: user.client?.name || null,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  }));
}

/**
 * Get user by ID with services
 */
export async function getUserById(userId: string, firmId: string) {
  const user = await (prisma as any).user.findFirst({
    where: {
      id: userId,
      firmId,
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
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
    role: user.role,
    clientId: user.clientId || null,
    clientName: user.client?.name || null,
    pan: user.pan || null,
    aadhar: user.aadhar || null,
    address: user.address || null,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
    services: (user.services || []).map((service: any) => ({
      id: service.id,
      title: service.title,
      type: service.type,
      status: service.status,
      dueDate: service.dueDate?.toISOString() || null,
    })),
  };
}

/**
 * Create user
 */
export async function createUser(firmId: string, userData: any) {
  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64').substring(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      firmId,
      clientId: userData.clientId || null,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      phone: userData.phone || null,
      role: userData.role,
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
 * Update user
 */
export async function updateUser(userId: string, firmId: string, userData: any) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
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
      clientId: userData.clientId,
    } as any,
  });

  return updated;
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(userId: string, firmId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
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

