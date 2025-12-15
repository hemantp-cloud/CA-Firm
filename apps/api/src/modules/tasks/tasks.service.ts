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

interface UserContext {
  id: string;
  role: string;
  firmId: string;
}

/**
 * Get all tasks with role-based filtering
 * Updated for new schema
 */
export async function getAllTasks(userContext: UserContext, serviceId?: string) {
  // Build where clause based on role
  const serviceWhere: any = {
    firmId: userContext.firmId,
  };

  // Role-based filtering on services
  if (userContext.role === 'PROJECT_MANAGER') {
    serviceWhere.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    serviceWhere.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    // Team member can see tasks assigned to them or for clients they're assigned to
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    serviceWhere.clientId = { in: assignments.map((a) => a.clientId) };
  }
  // ADMIN and SUPER_ADMIN see all

  const services = await prisma.service.findMany({
    where: serviceWhere,
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);

  const whereClause: any = {
    serviceId: {
      in: serviceIds,
    },
  };

  if (serviceId) {
    // Override with specific service if requested
    whereClause.serviceId = serviceId;
  }

  // For team members, also filter by assigned tasks
  if (userContext.role === 'TEAM_MEMBER') {
    whereClause.OR = [
      { serviceId: { in: serviceIds } },
      { assignedToId: userContext.id },
    ];
    delete whereClause.serviceId;
  }

  return await prisma.task.findMany({
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
  return await prisma.task.findUnique({
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
  // Verify assignedToId is a valid team member if provided
  if (data.assignedToId) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: data.assignedToId },
    });
    if (!teamMember) {
      throw new Error('Assigned team member not found');
    }
  }

  return await prisma.task.create({
    data: {
      serviceId: data.serviceId,
      assignedToId: data.assignedToId || null,
      title: data.title,
      description: data.description || null,
      status: data.status || 'PENDING',
      priority: data.priority !== undefined ? data.priority : 0,
      dueDate: data.dueDate || null,
    },
    include: {
      service: true,
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
    // If completed, set completedAt
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
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

  return await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      service: true,
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
 * Update only the status field of a task
 */
export async function updateTaskStatus(id: string, status: ServiceStatus) {
  return await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });
}

/**
 * Delete task by id
 */
export async function deleteTask(id: string) {
  return await prisma.task.delete({
    where: { id },
  });
}

/**
 * Get tasks grouped by status for Kanban board
 */
export async function getTasksGroupedByStatus(userContext: UserContext) {
  // Build where clause based on role
  const serviceWhere: any = {
    firmId: userContext.firmId,
  };

  if (userContext.role === 'PROJECT_MANAGER') {
    serviceWhere.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    serviceWhere.clientId = userContext.id;
  } else if (userContext.role === 'TEAM_MEMBER') {
    const assignments = await prisma.clientAssignment.findMany({
      where: { teamMemberId: userContext.id },
      select: { clientId: true },
    });
    serviceWhere.clientId = { in: assignments.map((a) => a.clientId) };
  }

  const services = await prisma.service.findMany({
    where: serviceWhere,
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);

  let whereClause: any = {
    serviceId: {
      in: serviceIds,
    },
  };

  // For team members, include tasks assigned to them
  if (userContext.role === 'TEAM_MEMBER') {
    whereClause = {
      OR: [
        { serviceId: { in: serviceIds } },
        { assignedToId: userContext.id },
      ],
    };
  }

  const tasks = await prisma.task.findMany({
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
      createdAt: 'asc',
    },
  });

  // Group tasks by status
  const grouped: Record<string, typeof tasks> = {
    PENDING: [],
    IN_PROGRESS: [],
    UNDER_REVIEW: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  tasks.forEach((task) => {
    const status = task.status as ServiceStatus;
    if (grouped[status]) {
      grouped[status].push(task);
    } else {
      // Fallback to PENDING - always defined
      grouped.PENDING!.push(task);
    }
  });

  return grouped;
}

/**
 * Get tasks for a specific team member
 */
export async function getTasksForTeamMember(teamMemberId: string) {
  return await prisma.task.findMany({
    where: {
      assignedToId: teamMemberId,
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
    },
    orderBy: {
      dueDate: 'asc',
    },
  });
}

/**
 * Get task statistics
 */
export async function getTaskStats(userContext: UserContext) {
  const serviceWhere: any = {
    firmId: userContext.firmId,
  };

  if (userContext.role === 'PROJECT_MANAGER') {
    serviceWhere.projectManagerId = userContext.id;
  } else if (userContext.role === 'CLIENT') {
    serviceWhere.clientId = userContext.id;
  }

  const services = await prisma.service.findMany({
    where: serviceWhere,
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);

  let whereBase: any = { serviceId: { in: serviceIds } };

  // For team members, filter by assigned tasks
  if (userContext.role === 'TEAM_MEMBER') {
    whereBase = { assignedToId: userContext.id };
  }

  const [pending, inProgress, underReview, completed] = await Promise.all([
    prisma.task.count({ where: { ...whereBase, status: 'PENDING' } }),
    prisma.task.count({ where: { ...whereBase, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { ...whereBase, status: 'UNDER_REVIEW' } }),
    prisma.task.count({ where: { ...whereBase, status: 'COMPLETED' } }),
  ]);

  return {
    pending,
    inProgress,
    underReview,
    completed,
    total: pending + inProgress + underReview + completed,
  };
}
