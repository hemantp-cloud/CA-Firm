import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../../utils/email';
import crypto from 'crypto';

// Type definitions for input data
interface CreateTeamMemberInput {
    name: string;
    email: string;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    password?: string | undefined;
    mustChangePassword?: boolean | undefined;
    twoFactorEnabled?: boolean | undefined;
}

interface UpdateTeamMemberInput {
    name?: string | null | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    isActive?: boolean | undefined;
    twoFactorEnabled?: boolean | undefined;
}

interface AssignClientsInput {
    clientIds: string[];
    notes?: string | null | undefined;
}

interface UnassignClientsInput {
    clientIds: string[];
}

/**
 * Get all team members in the firm
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function listTrainees(firmId: string, filters: { isActive?: boolean } = {}) {
    const where: any = {
        firmId,
        deletedAt: null,
    };

    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    const teamMembers = await prisma.teamMember.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Count assignments separately
    const teamMemberIds = teamMembers.map(t => t.id);
    const assignmentCounts = await prisma.clientAssignment.groupBy({
        by: ['teamMemberId'],
        where: {
            teamMemberId: { in: teamMemberIds },
        },
        _count: true,
    });

    const countsMap = new Map(assignmentCounts.map(item => [item.teamMemberId, item._count]));

    return teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        isActive: member.isActive,
        assignedClientsCount: countsMap.get(member.id) || 0,
        createdAt: member.createdAt.toISOString(),
        lastLoginAt: member.lastLoginAt?.toISOString() || null,
    }));
}

/**
 * Get team member by ID with assigned clients
 */
export async function getTraineeById(teamMemberId: string, firmId: string) {
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
            deletedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    // Get assignments separately
    const assignments = await prisma.clientAssignment.findMany({
        where: { teamMemberId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isActive: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.phone,
        address: teamMember.address,
        isActive: teamMember.isActive,
        createdAt: teamMember.createdAt.toISOString(),
        lastLoginAt: teamMember.lastLoginAt?.toISOString() || null,
        assignedClients: assignments.map((assignment) => ({
            assignmentId: assignment.id,
            client: assignment.client,
            assignedBy: assignment.assignedBy,
            assignedAt: assignment.createdAt.toISOString(),
            notes: assignment.notes,
        })),
    };
}

/**
 * Create a new team member
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function createTrainee(
    firmId: string,
    traineeData: CreateTeamMemberInput,
    createdBy: string,
    createdByRole: string
) {
    // Generate temporary password if not provided
    const tempPassword = traineeData.password || crypto.randomBytes(8).toString('base64').substring(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const teamMember = await prisma.teamMember.create({
        data: {
            firmId,
            createdBy,
            createdByRole,
            email: traineeData.email,
            password: hashedPassword,
            name: traineeData.name,
            phone: traineeData.phone || null,
            address: traineeData.address || null,
            emailVerified: true,
            mustChangePassword: traineeData.mustChangePassword ?? true,
            twoFactorEnabled: traineeData.twoFactorEnabled ?? false,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    // Send welcome email
    try {
        await sendWelcomeEmail(teamMember.email, tempPassword, teamMember.name, 'TEAM_MEMBER');
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }

    return {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email,
        role: 'TEAM_MEMBER',
    };
}

/**
 * Update team member details
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function updateTrainee(teamMemberId: string, firmId: string, traineeData: UpdateTeamMemberInput) {
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
            deletedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    // Build update data, excluding undefined values
    const updateData: any = {};
    if (traineeData.name !== undefined && traineeData.name !== null) updateData.name = traineeData.name;
    if (traineeData.phone !== undefined) updateData.phone = traineeData.phone;
    if (traineeData.address !== undefined) updateData.address = traineeData.address;
    if (traineeData.isActive !== undefined) updateData.isActive = traineeData.isActive;
    if (traineeData.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = traineeData.twoFactorEnabled;

    const updated = await prisma.teamMember.update({
        where: { id: teamMemberId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
        },
    });

    return updated;
}

/**
 * Soft delete team member (deactivate)
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function softDeleteTrainee(teamMemberId: string, firmId: string, deletedBy: string) {
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
            deletedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    await prisma.teamMember.update({
        where: { id: teamMemberId },
        data: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy,
        },
    });

    return { success: true, message: 'Team member deactivated successfully' };
}

/**
 * Permanently delete team member (hard delete)
 * Accessible ONLY by ADMIN/SUPER_ADMIN
 */
export async function permanentDeleteTrainee(teamMemberId: string, firmId: string) {
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    // This will cascade delete all client assignments
    await prisma.teamMember.delete({
        where: { id: teamMemberId },
    });

    return { success: true, message: 'Team member permanently deleted' };
}

/**
 * Assign clients to a team member
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function assignClientsToTrainee(
    teamMemberId: string,
    firmId: string,
    assignmentData: AssignClientsInput,
    assignedBy: string
) {
    // Verify team member exists
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
            isActive: true,
            deletedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found or inactive');
    }

    // Verify all clients exist and belong to the firm
    const clients = await prisma.client.findMany({
        where: {
            id: { in: assignmentData.clientIds },
            firmId,
            isActive: true,
            deletedAt: null,
        },
    });

    if (clients.length !== assignmentData.clientIds.length) {
        throw new Error('One or more clients not found or inactive');
    }

    // Create assignments
    const assignments = await prisma.$transaction(
        assignmentData.clientIds.map((clientId) =>
            prisma.clientAssignment.upsert({
                where: {
                    teamMemberId_clientId: {
                        teamMemberId,
                        clientId,
                    },
                },
                update: {
                    notes: assignmentData.notes ?? null,
                    assignedBy,
                },
                create: {
                    teamMemberId,
                    clientId,
                    assignedBy,
                    notes: assignmentData.notes ?? null,
                },
            })
        )
    );

    return {
        success: true,
        message: `${assignments.length} client(s) assigned to team member`,
        assignedCount: assignments.length,
    };
}

/**
 * Unassign clients from a team member
 * Accessible by ADMIN, SUPER_ADMIN, PROJECT_MANAGER
 */
export async function unassignClientsFromTrainee(
    teamMemberId: string,
    firmId: string,
    unassignmentData: UnassignClientsInput
) {
    // Verify team member exists
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    // Delete assignments
    const result = await prisma.clientAssignment.deleteMany({
        where: {
            teamMemberId,
            clientId: { in: unassignmentData.clientIds },
        },
    });

    return {
        success: true,
        message: `${result.count} client(s) unassigned from team member`,
        unassignedCount: result.count,
    };
}

/**
 * Get all clients assigned to a specific team member
 */
export async function getAssignedClients(teamMemberId: string, firmId: string) {
    const teamMember = await prisma.teamMember.findFirst({
        where: {
            id: teamMemberId,
            firmId,
            deletedAt: null,
        },
    });

    if (!teamMember) {
        throw new Error('Team member not found');
    }

    const assignments = await prisma.clientAssignment.findMany({
        where: {
            teamMemberId,
        },
        include: {
            client: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return assignments.map((assignment) => ({
        assignmentId: assignment.id,
        client: {
            ...assignment.client,
            servicesCount: 0,
            documentsCount: 0,
        },
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.createdAt.toISOString(),
        notes: assignment.notes,
    }));
}

/**
 * Get all team members assigned to a specific client
 */
export async function getTraineesForClient(clientId: string, firmId: string) {
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

    const assignments = await prisma.clientAssignment.findMany({
        where: {
            clientId,
        },
        include: {
            teamMember: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isActive: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return assignments.map((assignment) => ({
        assignmentId: assignment.id,
        trainee: assignment.teamMember, // Keep 'trainee' for backward compatibility
        teamMember: assignment.teamMember,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.createdAt.toISOString(),
        notes: assignment.notes,
    }));
}

/**
 * Get team member dashboard data
 * For team member's own dashboard
 */
export async function getTeamMemberDashboard(teamMemberId: string, _firmId: string) {
    // Get assigned clients count
    const assignedClientsCount = await prisma.clientAssignment.count({
        where: { teamMemberId },
    });

    // Get assigned clients list
    const assignments = await prisma.clientAssignment.findMany({
        where: { teamMemberId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    _count: {
                        select: {
                            services: true,
                            documents: true,
                        },
                    },
                },
            },
        },
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Get tasks assigned to this team member (if tasks exist)
    let pendingTasksCount = 0;
    let recentTasks: any[] = [];

    try {
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: teamMemberId,
                status: {
                    in: ['PENDING', 'IN_PROGRESS'],
                },
            },
            include: {
                service: {
                    select: {
                        id: true,
                        title: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            take: 5,
            orderBy: {
                dueDate: 'asc',
            },
        });

        pendingTasksCount = tasks.length;
        recentTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate?.toISOString() || null,
            service: task.service,
        }));
    } catch (error) {
        console.log('Tasks table may not exist yet');
    }

    return {
        assignedClientsCount,
        pendingTasksCount,
        recentClients: assignments.map(a => ({
            ...a.client,
            servicesCount: a.client._count.services,
            documentsCount: a.client._count.documents,
            assignedAt: a.createdAt.toISOString(),
        })),
        recentTasks,
    };
}
