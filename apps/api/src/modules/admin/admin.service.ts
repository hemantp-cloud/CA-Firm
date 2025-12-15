import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../../utils/email';
import crypto from 'crypto';

// ============================================
// DASHBOARD STATISTICS
// ============================================

/**
 * Get dashboard statistics for Admin/Super Admin
 */
export async function getDashboardStats(firmId: string) {
  // Count users from each role table
  const adminCount = await prisma.admin.count({
    where: { firmId, isActive: true, deletedAt: null },
  });

  const projectManagerCount = await prisma.projectManager.count({
    where: { firmId, isActive: true, deletedAt: null },
  });

  const teamMemberCount = await prisma.teamMember.count({
    where: { firmId, isActive: true, deletedAt: null },
  });

  const clientCount = await prisma.client.count({
    where: { firmId, isActive: true, deletedAt: null },
  });

  // Get service stats
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

  // Get revenue this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueThisMonth = await prisma.payment.aggregate({
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

  const payments = await prisma.payment.findMany({
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
    orderBy: {
      paymentDate: 'asc',
    },
  });

  // Group payments by month
  const revenueTrend = payments.reduce((acc: any[], payment: any) => {
    const month = new Date(payment.paymentDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.revenue += Number(payment.amount);
    } else {
      acc.push({ month, revenue: Number(payment.amount) });
    }
    return acc;
  }, []);

  // Get services by type
  const servicesByType = await prisma.service.groupBy({
    by: ['type'],
    where: {
      firmId,
    },
    _count: {
      id: true,
    },
  });

  // Get recent activity
  const recentActivity = await prisma.activityLog.findMany({
    where: {
      firmId,
    },
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityName: true,
      userType: true,
      createdAt: true,
    },
  });

  return {
    adminCount,
    projectManagerCount,
    teamMemberCount,
    clientCount,
    totalUsers: adminCount + projectManagerCount + teamMemberCount + clientCount,
    activeServicesCount,
    pendingServicesCount,
    revenueThisMonth: Number(revenueThisMonth._sum.amount || 0),
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
      userType: activity.userType,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Create user in appropriate table based on role
 */
export async function createUser(
  firmId: string,
  creatorId: string,
  creatorRole: string,
  userData: any
) {
  const { role, email, name, phone, pan, aadhar, address, managedBy } = userData;

  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString('base64').substring(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  let user: any;

  switch (role) {
    case 'ADMIN':
      // Only Super Admin can create Admins
      if (creatorRole !== 'SUPER_ADMIN') {
        throw new Error('Only Super Admin can create Admins');
      }
      user = await prisma.admin.create({
        data: {
          firmId,
          createdBy: creatorId,
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          emailVerified: true,
          mustChangePassword: true,
          isActive: true,
        },
      });
      break;

    case 'PROJECT_MANAGER':
      // Super Admin or Admin can create Project Managers
      if (!['SUPER_ADMIN', 'ADMIN'].includes(creatorRole)) {
        throw new Error('Only Super Admin or Admin can create Project Managers');
      }
      user = await prisma.projectManager.create({
        data: {
          firmId,
          createdBy: creatorId,
          createdByRole: creatorRole,
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          pan: pan || null,
          address: address || null,
          emailVerified: true,
          mustChangePassword: true,
          isActive: true,
        },
      });
      break;

    case 'TEAM_MEMBER':
      // Super Admin, Admin, or Project Manager can create Team Members
      if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(creatorRole)) {
        throw new Error('Insufficient permissions to create Team Members');
      }
      user = await prisma.teamMember.create({
        data: {
          firmId,
          createdBy: creatorId,
          createdByRole: creatorRole,
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          address: address || null,
          emailVerified: true,
          mustChangePassword: true,
          isActive: true,
        },
      });
      break;

    case 'CLIENT':
      // Super Admin, Admin, or Project Manager can create Clients
      if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(creatorRole)) {
        throw new Error('Insufficient permissions to create Clients');
      }
      if (!managedBy) {
        throw new Error('managedBy (Project Manager ID) is required for Clients');
      }
      user = await prisma.client.create({
        data: {
          firmId,
          managedBy,
          createdBy: creatorId,
          createdByRole: creatorRole,
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          pan: pan || null,
          aadhar: aadhar || null,
          address: address || null,
          emailVerified: true,
          mustChangePassword: true,
          isActive: true,
        },
      });
      break;

    default:
      throw new Error('Invalid role');
  }

  // Send welcome email
  await sendWelcomeEmail(email, tempPassword, name, role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
  };
}

/**
 * Get all users across all role tables
 */
export async function getAllUsers(
  firmId: string,
  filters: {
    role?: string;
    isActive?: boolean;
  }
) {
  const users: any[] = [];

  // Fetch from each table based on filters
  if (!filters.role || filters.role === 'ADMIN') {
    const whereClause: any = {
      firmId,
      deletedAt: null,
    };
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    const admins = await prisma.admin.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    users.push(...admins.map((u) => ({ ...u, role: 'ADMIN' })));
  }

  if (!filters.role || filters.role === 'PROJECT_MANAGER') {
    const whereClause: any = {
      firmId,
      deletedAt: null,
    };
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    const projectManagers = await prisma.projectManager.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    users.push(...projectManagers.map((u) => ({ ...u, role: 'PROJECT_MANAGER' })));
  }

  if (!filters.role || filters.role === 'TEAM_MEMBER') {
    const whereClause: any = {
      firmId,
      deletedAt: null,
    };
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    const teamMembers = await prisma.teamMember.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    users.push(...teamMembers.map((u) => ({ ...u, role: 'TEAM_MEMBER' })));
  }

  if (!filters.role || filters.role === 'CLIENT') {
    const whereClause: any = {
      firmId,
      deletedAt: null,
    };
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        projectManager: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    users.push(...clients.map((u) => ({
      ...u,
      role: 'CLIENT',
      managedByName: u.projectManager?.name || null,
    })));
  }

  return users.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    managedByName: user.managedByName || null,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
  }));
}

/**
 * Get user by ID from appropriate table
 */
export async function getUserById(userId: string, firmId: string, role: string) {
  let user: any;

  switch (role) {
    case 'ADMIN':
      user = await prisma.admin.findFirst({
        where: { id: userId, firmId, deletedAt: null },
      });
      break;
    case 'PROJECT_MANAGER':
      user = await prisma.projectManager.findFirst({
        where: { id: userId, firmId, deletedAt: null },
        include: {
          services: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              dueDate: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      break;
    case 'TEAM_MEMBER':
      user = await prisma.teamMember.findFirst({
        where: { id: userId, firmId, deletedAt: null },
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      break;
    case 'CLIENT':
      user = await prisma.client.findFirst({
        where: { id: userId, firmId, deletedAt: null },
        include: {
          projectManager: {
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
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      break;
    default:
      throw new Error('Invalid role');
  }

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role,
    pan: user.pan || null,
    aadhar: user.aadhar || null,
    address: user.address || null,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
    managedByName: user.projectManager?.name || null,
    services: user.services?.map((s: any) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      dueDate: s.dueDate?.toISOString() || null,
    })) || [],
    tasks: user.tasks?.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate?.toISOString() || null,
    })) || [],
  };
}

/**
 * Update user in appropriate table
 */
export async function updateUser(
  userId: string,
  _firmId: string,
  role: string,
  userData: any
) {
  const updateData: any = {};

  if (userData.name !== undefined) updateData.name = userData.name;
  if (userData.email !== undefined) updateData.email = userData.email;
  if (userData.phone !== undefined) updateData.phone = userData.phone || null;
  if (userData.pan !== undefined) updateData.pan = userData.pan || null;
  if (userData.aadhar !== undefined) updateData.aadhar = userData.aadhar || null;
  if (userData.address !== undefined) updateData.address = userData.address || null;

  let updated: any;

  switch (role) {
    case 'ADMIN':
      updated = await prisma.admin.update({
        where: { id: userId },
        data: updateData,
      });
      break;
    case 'PROJECT_MANAGER':
      updated = await prisma.projectManager.update({
        where: { id: userId },
        data: updateData,
      });
      break;
    case 'TEAM_MEMBER':
      updated = await prisma.teamMember.update({
        where: { id: userId },
        data: updateData,
      });
      break;
    case 'CLIENT':
      updated = await prisma.client.update({
        where: { id: userId },
        data: updateData,
      });
      break;
    default:
      throw new Error('Invalid role');
  }

  return updated;
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(
  userId: string,
  _firmId: string,
  role: string,
  deletedBy: string
) {
  const deleteData = {
    isActive: false,
    deletedAt: new Date(),
    deletedBy,
  };

  switch (role) {
    case 'ADMIN':
      await prisma.admin.update({
        where: { id: userId },
        data: deleteData,
      });
      break;
    case 'PROJECT_MANAGER':
      await prisma.projectManager.update({
        where: { id: userId },
        data: deleteData,
      });
      break;
    case 'TEAM_MEMBER':
      await prisma.teamMember.update({
        where: { id: userId },
        data: deleteData,
      });
      break;
    case 'CLIENT':
      await prisma.client.update({
        where: { id: userId },
        data: deleteData,
      });
      break;
    default:
      throw new Error('Invalid role');
  }

  return { success: true };
}

/**
 * Hard delete user (permanent)
 * Only Super Admin and Admin can hard delete
 */
export async function hardDeleteUser(
  userId: string,
  _firmId: string,
  role: string,
  deletedByRole: string
) {
  // Only Super Admin and Admin can hard delete
  if (!['SUPER_ADMIN', 'ADMIN'].includes(deletedByRole)) {
    throw new Error('Only Super Admin or Admin can permanently delete users');
  }

  switch (role) {
    case 'ADMIN':
      await prisma.admin.delete({
        where: { id: userId },
      });
      break;
    case 'PROJECT_MANAGER':
      await prisma.projectManager.delete({
        where: { id: userId },
      });
      break;
    case 'TEAM_MEMBER':
      await prisma.teamMember.delete({
        where: { id: userId },
      });
      break;
    case 'CLIENT':
      await prisma.client.delete({
        where: { id: userId },
      });
      break;
    default:
      throw new Error('Invalid role');
  }

  return { success: true };
}

// ============================================
// LEGACY FUNCTIONS (Deprecated - for backward compatibility)
// ============================================

/**
 * @deprecated Use createUser instead
 */
export async function createClient(_firmId: string, _clientData: any) {
  throw new Error('createClient is deprecated. Use createUser with role=CLIENT instead.');
}

/**
 * @deprecated Use getAllUsers with role filter instead
 */
export async function getAllClients(firmId: string) {
  return getAllUsers(firmId, { role: 'CLIENT' });
}

/**
 * @deprecated Use getUserById instead
 */
export async function getClientById(clientId: string, firmId: string) {
  return getUserById(clientId, firmId, 'CLIENT');
}

/**
 * @deprecated Use updateUser instead
 */
export async function updateClient(clientId: string, firmId: string, clientData: any) {
  return updateUser(clientId, firmId, 'CLIENT', clientData);
}

/**
 * @deprecated Use deleteUser instead
 */
export async function deleteClient(_clientId: string, _firmId: string) {
  throw new Error('deleteClient is deprecated. Use deleteUser instead.');
}

/**
 * @deprecated Reactivation should be done via updateUser
 */
export async function reactivateClient(clientId: string, _firmId: string) {
  return prisma.client.update({
    where: { id: clientId },
    data: { isActive: true, deletedAt: null, deletedBy: null },
  });
}
