import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireSuperAdmin, AuthenticatedRequest } from '../../shared/middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/super-admin/dashboard
 * Get dashboard stats for super admin
 */
router.get('/dashboard', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        // Get counts from each table using raw queries to avoid TypeScript issues
        const [adminsResult, pmsResult, tmsResult, clientsResult] = await Promise.all([
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM admins WHERE "firmId" = ${firmId} AND "isActive" = true`,
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM project_managers WHERE "firmId" = ${firmId} AND "isActive" = true`,
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM team_members WHERE "firmId" = ${firmId} AND "isActive" = true`,
            prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM clients WHERE "firmId" = ${firmId} AND "isActive" = true`,
        ]);

        const admins = Number(adminsResult[0]?.count || 0);
        const projectManagers = Number(pmsResult[0]?.count || 0);
        const teamMembers = Number(tmsResult[0]?.count || 0);
        const clients = Number(clientsResult[0]?.count || 0);

        res.status(200).json({
            success: true,
            data: {
                admins,
                projectManagers,
                teamMembers,
                clients,
                totalUsers: admins + projectManagers + teamMembers + clients,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
        });
    }
});

/**
 * GET /api/super-admin/users
 * Get all users by role
 */
router.get('/users', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const role = req.query.role as string;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        let users: any[] = [];

        switch (role) {
            case 'ADMIN':
                users = await prisma.$queryRaw`
          SELECT id, email, name, phone, "isActive", "createdAt", "lastLoginAt" 
          FROM admins 
          WHERE "firmId" = ${firmId} 
          ORDER BY "createdAt" DESC
        `;
                break;
            case 'PROJECT_MANAGER':
                users = await prisma.$queryRaw`
          SELECT id, email, name, phone, "isActive", "createdAt", "lastLoginAt" 
          FROM project_managers 
          WHERE "firmId" = ${firmId} 
          ORDER BY "createdAt" DESC
        `;
                break;
            case 'TEAM_MEMBER':
                users = await prisma.$queryRaw`
          SELECT id, email, name, phone, "isActive", "createdAt", "lastLoginAt" 
          FROM team_members 
          WHERE "firmId" = ${firmId} 
          ORDER BY "createdAt" DESC
        `;
                break;
            case 'CLIENT':
                users = await prisma.$queryRaw`
          SELECT id, email, name, phone, "companyName", "isActive", "createdAt", "lastLoginAt" 
          FROM clients 
          WHERE "firmId" = ${firmId} 
          ORDER BY "createdAt" DESC
        `;
                break;
        }

        res.status(200).json({
            success: true,
            data: users.map((u: any) => ({ ...u, role: role || u.role })),
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch users',
        });
    }
});

/**
 * POST /api/super-admin/admins
 * Create a new admin
 */
router.post('/admins', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const createdBy = req.user?.userId;

        if (!firmId || !createdBy) {
            res.status(400).json({ success: false, message: 'Firm ID and creator required' });
            return;
        }

        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required' });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.$queryRaw<any[]>`
      SELECT email FROM admins WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM project_managers WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM team_members WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM clients WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM super_admins WHERE email = ${email.toLowerCase()}
    `;

        if (existingUser.length > 0) {
            res.status(400).json({ success: false, message: 'Email already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const admin = await prisma.$queryRaw<any[]>`
      INSERT INTO admins (id, "firmId", "createdBy", email, password, name, phone, "isActive", "emailVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${firmId}, ${createdBy}, ${email.toLowerCase()}, ${hashedPassword}, ${name}, ${phone || null}, true, false, NOW(), NOW())
      RETURNING id, email, name, phone, "isActive", "createdAt"
    `;

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: admin[0],
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create admin',
        });
    }
});

/**
 * POST /api/super-admin/project-managers
 * Create a new project manager
 */
router.post('/project-managers', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const createdBy = req.user?.userId;

        if (!firmId || !createdBy) {
            res.status(400).json({ success: false, message: 'Firm ID and creator required' });
            return;
        }

        const { name, email, phone, password, pan } = req.body;

        // Validation
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required' });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.$queryRaw<any[]>`
      SELECT email FROM admins WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM project_managers WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM team_members WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM clients WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM super_admins WHERE email = ${email.toLowerCase()}
    `;

        if (existingUser.length > 0) {
            res.status(400).json({ success: false, message: 'Email already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create project manager
        const pm = await prisma.$queryRaw<any[]>`
      INSERT INTO project_managers (id, "firmId", "createdBy", "createdByRole", email, password, name, phone, pan, "isActive", "emailVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${firmId}, ${createdBy}, 'SUPER_ADMIN', ${email.toLowerCase()}, ${hashedPassword}, ${name}, ${phone || null}, ${pan || null}, true, false, NOW(), NOW())
      RETURNING id, email, name, phone, pan, "isActive", "createdAt"
    `;

        res.status(201).json({
            success: true,
            message: 'Project Manager created successfully',
            data: pm[0],
        });
    } catch (error) {
        console.error('Create project manager error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create project manager',
        });
    }
});

/**
 * POST /api/super-admin/team-members
 * Create a new team member
 */
router.post('/team-members', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const createdBy = req.user?.userId;

        if (!firmId || !createdBy) {
            res.status(400).json({ success: false, message: 'Firm ID and creator required' });
            return;
        }

        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required' });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.$queryRaw<any[]>`
      SELECT email FROM admins WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM project_managers WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM team_members WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM clients WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM super_admins WHERE email = ${email.toLowerCase()}
    `;

        if (existingUser.length > 0) {
            res.status(400).json({ success: false, message: 'Email already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create team member
        const tm = await prisma.$queryRaw<any[]>`
      INSERT INTO team_members (id, "firmId", "createdBy", "createdByRole", email, password, name, phone, "isActive", "emailVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${firmId}, ${createdBy}, 'SUPER_ADMIN', ${email.toLowerCase()}, ${hashedPassword}, ${name}, ${phone || null}, true, false, NOW(), NOW())
      RETURNING id, email, name, phone, "isActive", "createdAt"
    `;

        res.status(201).json({
            success: true,
            message: 'Team Member created successfully',
            data: tm[0],
        });
    } catch (error) {
        console.error('Create team member error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create team member',
        });
    }
});

/**
 * POST /api/super-admin/clients
 * Create a new client
 */
router.post('/clients', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firmId = req.user?.firmId;
        const createdBy = req.user?.userId;

        if (!firmId || !createdBy) {
            res.status(400).json({ success: false, message: 'Firm ID and creator required' });
            return;
        }

        const { name, email, phone, password, companyName, pan, gstin } = req.body;

        // Validation
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required' });
            return;
        }

        // Check if email already exists
        const existingUser = await prisma.$queryRaw<any[]>`
      SELECT email FROM admins WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM project_managers WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM team_members WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM clients WHERE email = ${email.toLowerCase()}
      UNION
      SELECT email FROM super_admins WHERE email = ${email.toLowerCase()}
    `;

        if (existingUser.length > 0) {
            res.status(400).json({ success: false, message: 'Email already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create client (managedBy is NULL - can be assigned to a Project Manager later)
        const client = await prisma.$queryRaw<any[]>`
      INSERT INTO clients (id, "firmId", "managedBy", "createdBy", "createdByRole", email, password, name, phone, "companyName", pan, gstin, "isActive", "emailVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${firmId}, NULL, ${createdBy}, 'SUPER_ADMIN', ${email.toLowerCase()}, ${hashedPassword}, ${name}, ${phone || null}, ${companyName || null}, ${pan || null}, ${gstin || null}, true, false, NOW(), NOW())
      RETURNING id, email, name, phone, "companyName", pan, gstin, "isActive", "createdAt"
    `;

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client[0],
        });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create client',
        });
    }
});

// ============================================
// GET SINGLE USER BY ID AND ROLE
// ============================================
router.get('/users/:role/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role, id } = req.params;
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        let user: any = null;

        switch (role) {
            case 'ADMIN':
                const admins = await prisma.$queryRaw<any[]>`
          SELECT id, email, name, phone, "isActive", "emailVerified", "createdAt", "updatedAt", "lastLoginAt"
          FROM admins 
          WHERE id = ${id} AND "firmId" = ${firmId}
        `;
                user = admins[0];
                break;
            case 'PROJECT_MANAGER':
                const pms = await prisma.$queryRaw<any[]>`
          SELECT id, email, name, phone, pan, "isActive", "emailVerified", "createdAt", "updatedAt", "lastLoginAt"
          FROM project_managers 
          WHERE id = ${id} AND "firmId" = ${firmId}
        `;
                user = pms[0];
                break;
            case 'TEAM_MEMBER':
                const tms = await prisma.$queryRaw<any[]>`
          SELECT id, email, name, phone, "isActive", "emailVerified", "createdAt", "updatedAt", "lastLoginAt"
          FROM team_members 
          WHERE id = ${id} AND "firmId" = ${firmId}
        `;
                user = tms[0];
                break;
            case 'CLIENT':
                const clients = await prisma.$queryRaw<any[]>`
          SELECT id, email, name, phone, "companyName", pan, gstin, "managedBy", "isActive", "emailVerified", "createdAt", "updatedAt", "lastLoginAt"
          FROM clients 
          WHERE id = ${id} AND "firmId" = ${firmId}
        `;
                user = clients[0];
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid role' });
                return;
        }

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get user',
        });
    }
});

// ============================================
// UPDATE USER
// ============================================
router.put('/users/:role/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role, id } = req.params;
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        const { name, email, phone, pan, gstin, companyName, isActive } = req.body;

        // Check if email is being changed and if it already exists
        if (email) {
            const existingUser = await prisma.$queryRaw<any[]>`
        SELECT email FROM admins WHERE email = ${email.toLowerCase()} AND id != ${id}
        UNION
        SELECT email FROM project_managers WHERE email = ${email.toLowerCase()} AND id != ${id}
        UNION
        SELECT email FROM team_members WHERE email = ${email.toLowerCase()} AND id != ${id}
        UNION
        SELECT email FROM clients WHERE email = ${email.toLowerCase()} AND id != ${id}
        UNION
        SELECT email FROM super_admins WHERE email = ${email.toLowerCase()} AND id != ${id}
      `;

            if (existingUser.length > 0) {
                res.status(400).json({ success: false, message: 'Email already exists' });
                return;
            }
        }

        let updatedUser: any = null;

        switch (role) {
            case 'ADMIN':
                updatedUser = await prisma.$queryRaw<any[]>`
          UPDATE admins 
          SET name = ${name}, email = ${email ? email.toLowerCase() : email}, phone = ${phone || null}, "isActive" = ${isActive !== undefined ? isActive : true}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id, email, name, phone, "isActive", "updatedAt"
        `;
                break;
            case 'PROJECT_MANAGER':
                updatedUser = await prisma.$queryRaw<any[]>`
          UPDATE project_managers 
          SET name = ${name}, email = ${email ? email.toLowerCase() : email}, phone = ${phone || null}, pan = ${pan || null}, "isActive" = ${isActive !== undefined ? isActive : true}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id, email, name, phone, pan, "isActive", "updatedAt"
        `;
                break;
            case 'TEAM_MEMBER':
                updatedUser = await prisma.$queryRaw<any[]>`
          UPDATE team_members 
          SET name = ${name}, email = ${email ? email.toLowerCase() : email}, phone = ${phone || null}, "isActive" = ${isActive !== undefined ? isActive : true}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id, email, name, phone, "isActive", "updatedAt"
        `;
                break;
            case 'CLIENT':
                updatedUser = await prisma.$queryRaw<any[]>`
          UPDATE clients 
          SET name = ${name}, email = ${email ? email.toLowerCase() : email}, phone = ${phone || null}, "companyName" = ${companyName || null}, pan = ${pan || null}, gstin = ${gstin || null}, "isActive" = ${isActive !== undefined ? isActive : true}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id, email, name, phone, "companyName", pan, gstin, "isActive", "updatedAt"
        `;
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid role' });
                return;
        }

        if (!updatedUser || updatedUser.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser[0],
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update user',
        });
    }
});

// ============================================
// DELETE (DEACTIVATE) USER
// ============================================
router.delete('/users/:role/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role, id } = req.params;
        const firmId = req.user?.firmId;
        const deletedBy = req.user?.id;

        if (!firmId || !deletedBy) {
            res.status(400).json({ success: false, message: 'Firm ID and user ID required' });
            return;
        }

        let result: any = null;

        switch (role) {
            case 'ADMIN':
                result = await prisma.$queryRaw<any[]>`
          UPDATE admins 
          SET "isActive" = false, "deletedAt" = NOW(), "deletedBy" = ${deletedBy}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'PROJECT_MANAGER':
                result = await prisma.$queryRaw<any[]>`
          UPDATE project_managers 
          SET "isActive" = false, "deletedAt" = NOW(), "deletedBy" = ${deletedBy}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'TEAM_MEMBER':
                result = await prisma.$queryRaw<any[]>`
          UPDATE team_members 
          SET "isActive" = false, "deletedAt" = NOW(), "deletedBy" = ${deletedBy}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'CLIENT':
                result = await prisma.$queryRaw<any[]>`
          UPDATE clients 
          SET "isActive" = false, "deletedAt" = NOW(), "deletedBy" = ${deletedBy}, "updatedAt" = NOW()
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid role' });
                return;
        }

        if (!result || result.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({
            success: true,
            message: 'User deactivated successfully',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to deactivate user',
        });
    }
});

// ============================================
// PERMANENT DELETE USER (HARD DELETE)
// ============================================
router.delete('/users/:role/:id/permanent', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { role, id } = req.params;
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        let result: any = null;

        switch (role) {
            case 'ADMIN':
                result = await prisma.$queryRaw<any[]>`
          DELETE FROM admins 
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'PROJECT_MANAGER':
                result = await prisma.$queryRaw<any[]>`
          DELETE FROM project_managers 
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'TEAM_MEMBER':
                result = await prisma.$queryRaw<any[]>`
          DELETE FROM team_members 
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            case 'CLIENT':
                result = await prisma.$queryRaw<any[]>`
          DELETE FROM clients 
          WHERE id = ${id} AND "firmId" = ${firmId}
          RETURNING id
        `;
                break;
            default:
                res.status(400).json({ success: false, message: 'Invalid role' });
                return;
        }

        if (!result || result.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({
            success: true,
            message: 'User permanently deleted',
        });
    } catch (error) {
        console.error('Permanent delete user error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to permanently delete user',
        });
    }
});

// ============================================
// FIRM SETTINGS MANAGEMENT
// ============================================

/**
 * GET /api/super-admin/firm/settings
 * Get firm details
 */
router.get('/firm/settings', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const firmId = req.user?.firmId;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        const firm = await prisma.$queryRaw<any[]>`
            SELECT id, name, email, phone, address, gstin, pan, website, logo, "createdAt", "updatedAt"
            FROM firms
            WHERE id = ${firmId}
        `;

        if (!firm || firm.length === 0) {
            res.status(404).json({ success: false, message: 'Firm not found' });
            return;
        }

        res.json({
            success: true,
            data: firm[0],
        });
    } catch (error) {
        console.error('Get firm settings error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch firm settings',
        });
    }
});

/**
 * PUT /api/super-admin/firm/settings
 * Update firm details
 */
router.put('/firm/settings', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const firmId = req.user?.firmId;
        const { name, email, phone, address, gstin, pan, website, logo } = req.body;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        const updatedFirm = await prisma.$queryRaw<any[]>`
            UPDATE firms
            SET 
                name = ${name || null},
                email = ${email || null},
                phone = ${phone || null},
                address = ${address || null},
                gstin = ${gstin || null},
                pan = ${pan || null},
                website = ${website || null},
                logo = ${logo || null},
                "updatedAt" = NOW()
            WHERE id = ${firmId}
            RETURNING id, name, email, phone, address, gstin, pan, website, logo, "updatedAt"
        `;

        if (!updatedFirm || updatedFirm.length === 0) {
            res.status(404).json({ success: false, message: 'Firm not found' });
            return;
        }

        // Log the activity
        await prisma.$queryRaw`
            INSERT INTO activity_logs ("firmId", "userId", "userType", action, "entityType", "entityId", "entityName", details, "createdAt")
            VALUES (
                ${firmId},
                ${req.user?.userId},
                'SUPER_ADMIN',
                'UPDATE',
                'FIRM',
                ${firmId},
                ${name || 'Firm'},
                ${JSON.stringify({ changes: req.body })}::jsonb,
                NOW()
            )
        `;

        res.json({
            success: true,
            message: 'Firm settings updated successfully',
            data: updatedFirm[0],
        });
    } catch (error) {
        console.error('Update firm settings error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update firm settings',
        });
    }
});

// ============================================
// AUDIT LOGS / ACTIVITY TRACKING
// ============================================

/**
 * GET /api/super-admin/audit-logs
 * Get activity logs with filtering
 */
router.get('/audit-logs', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const firmId = req.user?.firmId;
        const { page = '1', limit = '50', action, entityType, userId, startDate, endDate } = req.query;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build filter conditions
        let whereConditions = [`"firmId" = '${firmId}'`];

        if (action) whereConditions.push(`action = '${action}'`);
        if (entityType) whereConditions.push(`"entityType" = '${entityType}'`);
        if (userId) whereConditions.push(`"userId" = '${userId}'`);
        if (startDate) whereConditions.push(`"createdAt" >= '${startDate}'`);
        if (endDate) whereConditions.push(`"createdAt" <= '${endDate}'`);

        const whereClause = whereConditions.join(' AND ');

        const logs = await prisma.$queryRaw<any[]>`
            SELECT 
                id, "userId", "userType", action, "entityType", "entityId", "entityName",
                details, "ipAddress", "userAgent", "createdAt"
            FROM activity_logs
            WHERE ${prisma.$queryRawUnsafe(whereClause)}
            ORDER BY "createdAt" DESC
            LIMIT ${limitNum}
            OFFSET ${offset}
        `;

        const totalCount = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*)::int as count
            FROM activity_logs
            WHERE ${prisma.$queryRawUnsafe(whereClause)}
        `;

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount[0]?.count || 0,
                totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch audit logs',
        });
    }
});

/**
 * GET /api/super-admin/recent-activity
 * Get recent activity for dashboard
 */
router.get('/recent-activity', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const firmId = req.user?.firmId;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!firmId) {
            res.status(400).json({ success: false, message: 'Firm ID required' });
            return;
        }

        const activities = await prisma.$queryRaw<any[]>`
            SELECT 
                id, "userId", "userType", action, "entityType", "entityId", "entityName",
                details, "createdAt"
            FROM activity_logs
            WHERE "firmId" = ${firmId}
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
        `;

        res.json({
            success: true,
            data: activities,
        });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch recent activity',
        });
    }
});

export default router;

