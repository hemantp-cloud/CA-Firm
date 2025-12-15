import prisma from '../../shared/utils/prisma';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface UserContext {
    id: string;
    role: string;
    firmId: string;
    name: string;
}

// ============================================
// CLIENT-PM ASSIGNMENT CRUD
// ============================================

/**
 * Get all PM assignments for a client
 */
export async function getClientPMAssignments(
    clientId: string,
    user: UserContext
) {
    // Verify client exists
    const client = await prisma.client.findFirst({
        where: {
            id: clientId,
            firmId: user.firmId,
            deletedAt: null,
        },
    });

    if (!client) {
        throw new Error('Client not found');
    }

    return await prisma.clientPMAssignment.findMany({
        where: {
            clientId,
            firmId: user.firmId,
            isActive: true,
        },
        include: {
            projectManager: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
        orderBy: { assignedAt: 'desc' },
    });
}

/**
 * Assign a PM to a client
 */
export async function assignPMToClient(
    clientId: string,
    user: UserContext,
    data: {
        projectManagerId: string;
        role?: string;
        notes?: string;
    }
) {
    // Only PM or higher can assign
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can assign PMs to clients');
    }

    const { projectManagerId, role, notes } = data;

    // Verify client exists
    const client = await prisma.client.findFirst({
        where: {
            id: clientId,
            firmId: user.firmId,
            deletedAt: null,
        },
    });

    if (!client) {
        throw new Error('Client not found');
    }

    // Verify PM exists
    const pm = await prisma.projectManager.findFirst({
        where: {
            id: projectManagerId,
            firmId: user.firmId,
            deletedAt: null,
        },
    });

    if (!pm) {
        throw new Error('Project Manager not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.clientPMAssignment.findUnique({
        where: {
            clientId_projectManagerId: {
                clientId,
                projectManagerId,
            },
        },
    });

    if (existingAssignment) {
        if (existingAssignment.isActive) {
            throw new Error('This PM is already assigned to this client');
        }

        // Reactivate if previously removed
        return await prisma.clientPMAssignment.update({
            where: { id: existingAssignment.id },
            data: {
                isActive: true,
                role: role || existingAssignment.role,
                notes: notes || existingAssignment.notes,
                assignedBy: user.id,
                assignedByRole: user.role,
                assignedByName: user.name,
                assignedAt: new Date(),
                removedAt: null,
                removedBy: null,
                removedByRole: null,
                removalReason: null,
            },
            include: {
                projectManager: {
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
                        email: true,
                    },
                },
            },
        });
    }

    // Create new assignment
    return await prisma.clientPMAssignment.create({
        data: {
            firmId: user.firmId,
            clientId,
            projectManagerId,
            role: role || 'GENERAL',
            notes: notes || null,
            assignedBy: user.id,
            assignedByRole: user.role,
            assignedByName: user.name,
        },
        include: {
            projectManager: {
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
                    email: true,
                },
            },
        },
    });
}

/**
 * Update a PM assignment (change role)
 */
export async function updatePMAssignment(
    assignmentId: string,
    user: UserContext,
    data: {
        role?: string;
        notes?: string;
    }
) {
    // Only PM or higher can update
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can update PM assignments');
    }

    const assignment = await prisma.clientPMAssignment.findFirst({
        where: {
            id: assignmentId,
            firmId: user.firmId,
            isActive: true,
        },
    });

    if (!assignment) {
        throw new Error('Assignment not found');
    }

    return await prisma.clientPMAssignment.update({
        where: { id: assignmentId },
        data: {
            role: data.role || assignment.role,
            notes: data.notes !== undefined ? data.notes : assignment.notes,
        },
        include: {
            projectManager: {
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
                    email: true,
                },
            },
        },
    });
}

/**
 * Remove a PM assignment from a client
 */
export async function removePMFromClient(
    assignmentId: string,
    user: UserContext,
    reason?: string
) {
    // Only PM or higher can remove
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
        throw new Error('Only Project Manager or Admin can remove PM assignments');
    }

    const assignment = await prisma.clientPMAssignment.findFirst({
        where: {
            id: assignmentId,
            firmId: user.firmId,
            isActive: true,
        },
    });

    if (!assignment) {
        throw new Error('Assignment not found');
    }

    return await prisma.clientPMAssignment.update({
        where: { id: assignmentId },
        data: {
            isActive: false,
            removedAt: new Date(),
            removedBy: user.id,
            removedByRole: user.role,
            removalReason: reason || null,
        },
        include: {
            projectManager: {
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
                    email: true,
                },
            },
        },
    });
}

/**
 * Get all clients assigned to a PM
 */
export async function getPMClients(
    projectManagerId: string,
    user: UserContext
) {
    // Verify access
    if (user.role === 'PROJECT_MANAGER' && user.id !== projectManagerId) {
        throw new Error('Access denied');
    }

    const pm = await prisma.projectManager.findFirst({
        where: {
            id: projectManagerId,
            firmId: user.firmId,
            deletedAt: null,
        },
    });

    if (!pm) {
        throw new Error('Project Manager not found');
    }

    return await prisma.clientPMAssignment.findMany({
        where: {
            projectManagerId,
            firmId: user.firmId,
            isActive: true,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    companyName: true,
                    gstin: true,
                },
            },
        },
        orderBy: { assignedAt: 'desc' },
    });
}

/**
 * Get assignment history for a client (including removed)
 */
export async function getClientPMAssignmentHistory(
    clientId: string,
    user: UserContext
) {
    // Only admin can see full history
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new Error('Only Admin can view assignment history');
    }

    const client = await prisma.client.findFirst({
        where: {
            id: clientId,
            firmId: user.firmId,
        },
    });

    if (!client) {
        throw new Error('Client not found');
    }

    return await prisma.clientPMAssignment.findMany({
        where: {
            clientId,
            firmId: user.firmId,
        },
        include: {
            projectManager: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { assignedAt: 'desc' },
    });
}
