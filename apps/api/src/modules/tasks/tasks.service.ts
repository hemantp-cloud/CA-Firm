import prisma from '../../shared/utils/prisma';
import { ServiceStatus } from '@prisma/client';

// TypeScript types for Task operations
export interface CreateTaskData {
  serviceId: string;
  assignedToId?: string | null;
  title: string;
  description?: string | null;
  status?: ServiceStatus;
  priority?: number; // 0=Low, 1=Medium, 2=High
  dueDate?: Date | null;
}

export interface UpdateTaskData {
  serviceId?: string;
  assignedToId?: string | null;
  title?: string;
  description?: string | null;
  status?: ServiceStatus;
  priority?: number; // 0=Low, 1=Medium, 2=High
  dueDate?: Date | null;
  completedAt?: Date | null;
}

/**
 * Get all tasks for a firm, optionally filtered by serviceId
 * Includes service and assignedTo relations
 */
export async function getAllTasks(firmId: string, serviceId?: string) {
  // First get all services for the firm to filter tasks
  const services = await prisma.service.findMany({
    where: { firmId },
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);

  const whereClause: any = {
    serviceId: {
      in: serviceIds,
    },
  };

  if (serviceId) {
    whereClause.serviceId = serviceId;
  }

  return await (prisma as any).task.findMany({
    where: whereClause,
    include: {
      service: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignedTo: {
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
 * Get task by id with relations
 */
export async function getTaskById(id: string) {
  return await (prisma as any).task.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignedTo: {
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
 * Create a new task
 */
export async function createTask(data: CreateTaskData) {
  return await (prisma as any).task.create({
    data: {
      serviceId: data.serviceId,
      assignedToId: data.assignedToId || null,
      title: data.title,
      description: data.description || null,
      status: data.status || 'PENDING',
      priority: data.priority !== undefined ? data.priority : 0,
      dueDate: data.dueDate || null,
    },
  });
}

/**
 * Update task by id
 */
export async function updateTask(id: string, data: UpdateTaskData) {
  const updateData: any = {};

  if (data.serviceId !== undefined) {
    updateData.serviceId = data.serviceId;
  }
  if (data.assignedToId !== undefined) {
    updateData.assignedToId = data.assignedToId || null;
  }
  if (data.title !== undefined) {
    updateData.title = data.title;
  }
  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate || null;
  }
  if (data.completedAt !== undefined) {
    updateData.completedAt = data.completedAt || null;
  }

  return await (prisma as any).task.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Update only the status field of a task
 */
export async function updateTaskStatus(id: string, status: ServiceStatus) {
  return await (prisma as any).task.update({
    where: { id },
    data: {
      status,
    },
  });
}

/**
 * Delete task by id
 */
export async function deleteTask(id: string) {
  return await (prisma as any).task.delete({
    where: { id },
  });
}

/**
 * Get tasks grouped by status for Kanban board
 */
export async function getTasksGroupedByStatus(firmId: string) {
  // First get all services for the firm to filter tasks
  const services = await prisma.service.findMany({
    where: { firmId },
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);

  const tasks = await (prisma as any).task.findMany({
    where: {
      serviceId: {
        in: serviceIds,
      },
    },
    include: {
      service: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group tasks by status (using ServiceStatus enum values)
  const grouped: Record<string, typeof tasks> = {
    PENDING: [],
    IN_PROGRESS: [],
    UNDER_REVIEW: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  tasks.forEach((task: any) => {
    const status = task.status as ServiceStatus;
    if (grouped[status]) {
      grouped[status].push(task);
    } else {
      // Fallback for unknown statuses
      grouped.PENDING.push(task);
    }
  });

  return grouped;
}
