import prisma from '../../shared/utils/prisma';
import { ServiceStatus, ServiceType } from '@prisma/client';

interface ServiceFilters {
  status?: ServiceStatus;
  type?: ServiceType;
  clientId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UserContext {
  id: string;
  role: string; // 'CA' | 'CLIENT' | 'USER'
  firmId: string;
  clientId: string | null;
}

/**
 * Get all services with role-based filtering
 * - CA: all services in firm
 * - CLIENT: services of their users
 * - USER: only their services
 */
export async function getAllServices(userContext: UserContext, filters: ServiceFilters = {}) {
  const where: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering
  if (userContext.role === 'CLIENT') {
    // CLIENT can only see services of users under them
    where.clientId = userContext.clientId;
  } else if (userContext.role === 'USER') {
    // USER can only see their own services
    where.userId = userContext.id;
  }

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

  if (filters.userId) {
    where.userId = filters.userId;
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
        select: {
          id: true,
          fileName: true,
          documentType: true,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      },
    } as any,
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
  if (userContext.role === 'CLIENT') {
    where.clientId = userContext.clientId;
  } else if (userContext.role === 'USER') {
    where.userId = userContext.id;
  }

  const service = await prisma.service.findFirst({
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
      tasks: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      documents: {
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
 * Create a new service (CA only)
 */
export async function createService(firmId: string, data: any) {
  const {
    clientId,
    userId,
    type,
    title,
    description,
    financialYear,
    period,
    dueDate,
    feeAmount,
    notes,
  } = data;

  // Verify user exists and belongs to the firm
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      firmId,
      role: 'USER' as any,
    },
  });

  if (!user) {
    throw new Error('User not found or invalid');
  }

  // If clientId provided, verify it matches user's clientId
  const userWithClient = user as any;
  if (clientId && userWithClient.clientId !== clientId) {
    throw new Error('Client does not match user');
  }

  return await prisma.service.create({
    data: {
      firmId,
      userId,
      clientId: userWithClient.clientId || clientId || null,
      type: type as ServiceType,
      title,
      description: description || null,
      financialYear: financialYear || null,
      period: period || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      feeAmount: feeAmount ? parseFloat(feeAmount) : null,
      notes: notes || null,
      status: 'PENDING' as ServiceStatus,
    } as any,
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
    } as any,
  });
}

/**
 * Update service (CA only)
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
  if (data.financialYear !== undefined) updateData.financialYear = data.financialYear;
  if (data.period !== undefined) updateData.period = data.period;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.feeAmount !== undefined) updateData.feeAmount = data.feeAmount ? parseFloat(data.feeAmount) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return await prisma.service.update({
    where: { id },
    data: updateData,
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
    } as any,
  });
}

/**
 * Update only the status field of a service (CA only)
 * Logs activity
 */
export async function updateServiceStatus(
  id: string,
  firmId: string,
  status: ServiceStatus,
  userId: string
) {
  // First verify the service exists and belongs to the firm
  const service = await prisma.service.findFirst({
    where: {
      id,
      firmId,
    },
    include: {
      user: {
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
    } as any,
  });

  // Log activity
  try {
    await (prisma as any).activityLog.create({
      data: {
        firmId,
        userId,
        action: 'SERVICE_STATUS_UPDATED',
        entityType: 'Service',
        entityId: id,
        entityName: service.title,
        details: JSON.stringify({
          oldStatus: service.status,
          newStatus: status,
        }),
      },
    });
  } catch (error) {
    // ActivityLog might not be available yet
    console.warn('Failed to log activity:', error);
  }

  return updated;
}

/**
 * Delete service (soft delete - CA only)
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
  if (userContext.role === 'CLIENT') {
    where.clientId = userContext.clientId;
  } else if (userContext.role === 'USER') {
    where.userId = userContext.id;
  }

  const services = await prisma.service.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
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
