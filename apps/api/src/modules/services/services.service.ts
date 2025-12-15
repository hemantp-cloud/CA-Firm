import prisma from '../../shared/utils/prisma';
import { ServiceStatus, ServiceType } from '@prisma/client';

interface ServiceFilters {
  status?: ServiceStatus;
  type?: ServiceType;
  clientId?: string;
  projectManagerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UserContext {
  id: string;
  role: string; // 'ADMIN' | 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT'
  firmId: string;
}

/**
 * Get all services with role-based filtering
 * - ADMIN/SUPER_ADMIN: all services in firm
 * - PROJECT_MANAGER: services of their managed clients
 * - TEAM_MEMBER: services of assigned clients
 * - CLIENT: only their services
 */
export async function getAllServices(userContext: UserContext, filters: ServiceFilters = {}) {
  const where: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    // Project Manager can only see services of clients they manage
    where.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    // CLIENT can only see their own services
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    // Team Member can see services of assigned clients
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map(a => a.clientId) };
  }
  // ADMIN and SUPER_ADMIN can see all services in the firm

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.projectManagerId) {
    where.projectManagerId = filters.projectManagerId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.dueDate = {};
    if (filters.dateFrom) {
      where.dueDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.dueDate.lte = new Date(filters.dateTo);
    }
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
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      documents: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          fileName: true,
          documentType: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get service by id with ownership check
 */
export async function getServiceById(id: string, userContext: UserContext) {
  const where: any = {
    id,
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    where.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map(a => a.clientId) };
  }

  const service = await prisma.service.findFirst({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tasks: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      documents: {
        where: {
          isDeleted: false,
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

  return service;
}

/**
 * Create a new service (ADMIN/PROJECT_MANAGER)
 */
export async function createService(firmId: string, creatorId: string, creatorRole: string, data: any) {
  const {
    clientId,
    type,
    title,
    description,
    dueDate,
    feeAmount,
    notes,
  } = data;

  // Verify client exists and belongs to the firm
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      firmId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new Error('Client not found or invalid');
  }

  // Determine projectManagerId
  let projectManagerId: string | null = null;

  if (creatorRole === 'PROJECT_MANAGER') {
    projectManagerId = creatorId;
  } else if (client.managedBy) {
    projectManagerId = client.managedBy;
  }

  return await prisma.service.create({
    data: {
      firmId,
      clientId,
      projectManagerId,
      type: type as ServiceType,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      feeAmount: feeAmount ? parseFloat(feeAmount) : null,
      notes: notes || null,
      status: 'PENDING' as ServiceStatus,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Update service (ADMIN/PROJECT_MANAGER only)
 */
export async function updateService(id: string, firmId: string, data: any) {
  // First verify the service exists and belongs to the firm
  const service = await prisma.service.findFirst({
    where: {
      id,
      firmId,
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type as ServiceType;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.feeAmount !== undefined) updateData.feeAmount = data.feeAmount ? parseFloat(data.feeAmount) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return await prisma.service.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Update only the status field of a service (ADMIN/PM only)
 * Logs activity
 */
export async function updateServiceStatus(
  id: string,
  firmId: string,
  status: ServiceStatus,
  userId: string,
  userRole: string
) {
  // First verify the service exists and belongs to the firm
  const service = await prisma.service.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Update service status
  const updated = await prisma.service.update({
    where: { id },
    data: {
      status,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Log activity
  try {
    await prisma.activityLog.create({
      data: {
        firmId,
        userId,
        userType: userRole,
        action: 'SERVICE_STATUS_UPDATED',
        entityType: 'Service',
        entityId: id,
        entityName: service.title,
        details: {
          oldStatus: service.status,
          newStatus: status,
        },
      },
    });
  } catch (error) {
    console.warn('Failed to log activity:', error);
  }

  return updated;
}

/**
 * Delete service (soft delete - ADMIN/PM only)
 */
export async function deleteService(id: string, firmId: string) {
  // First verify the service exists and belongs to the firm
  const service = await prisma.service.findFirst({
    where: {
      id,
      firmId,
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Soft delete by setting status to CANCELLED
  return await prisma.service.update({
    where: { id },
    data: {
      status: 'CANCELLED' as ServiceStatus,
    },
  });
}

/**
 * Get services grouped by status for Kanban view
 */
export async function getServicesByStatus(userContext: UserContext) {
  const where: any = {
    firmId: userContext.firmId,
    status: {
      not: 'CANCELLED', // Exclude cancelled services from Kanban
    },
  };

  // Role-based filtering
  if (userContext.role === 'PROJECT_MANAGER') {
    where.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    where.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    where.clientId = { in: assignments.map(a => a.clientId) };
  }

  const services = await prisma.service.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group services by status
  const grouped: Record<string, typeof services> = {
    PENDING: [],
    IN_PROGRESS: [],
    UNDER_REVIEW: [],
    COMPLETED: [],
  };

  services.forEach((service) => {
    const status = service.status as keyof typeof grouped;
    if (grouped[status]) {
      grouped[status].push(service);
    }
  });

  return grouped;
}

/**
 * Get service statistics for dashboard
 */
export async function getServiceStats(firmId: string, userContext?: UserContext) {
  const where: any = {
    firmId,
  };

  // Apply role filtering if userContext provided
  if (userContext) {
    if (userContext.role === 'PROJECT_MANAGER') {
      where.projectManagerId = userContext.id;
    } else if (userContext.role === 'CLIENT') {
      where.clientId = userContext.id;
    }
  }

  const [pending, inProgress, underReview, completed, cancelled] = await Promise.all([
    prisma.service.count({ where: { ...where, status: 'PENDING' } }),
    prisma.service.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.service.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
    prisma.service.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.service.count({ where: { ...where, status: 'CANCELLED' } }),
  ]);

  return {
    pending,
    inProgress,
    underReview,
    completed,
    cancelled,
    total: pending + inProgress + underReview + completed,
  };
}
