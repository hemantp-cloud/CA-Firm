import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
    console.log('='.repeat(80));
    console.log('DATABASE ANALYSIS REPORT');
    console.log('='.repeat(80));
    console.log('\n');

    try {
        // 1. USERS TABLE ANALYSIS
        console.log('1. USERS TABLE ANALYSIS');
        console.log('-'.repeat(80));

        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                clientId: true,
                firmId: true,
                isActive: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log(`Total Users in Database: ${allUsers.length}\n`);

        // Group by role
        const usersByRole = allUsers.reduce((acc, user) => {
            if (!acc[user.role]) {
                acc[user.role] = [];
            }
            acc[user.role].push(user);
            return acc;
        }, {} as Record<string, typeof allUsers>);

        Object.entries(usersByRole).forEach(([role, users]) => {
            console.log(`\n${role} Users (${users.length}):`);
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.email}`);
                console.log(`     Name: ${user.name}`);
                console.log(`     ClientId: ${user.clientId || 'NULL'}`);
                console.log(`     Active: ${user.isActive}`);
                console.log(`     FirmId: ${user.firmId}`);
            });
        });

        // 2. CLIENTS TABLE ANALYSIS
        console.log('\n\n2. CLIENTS TABLE ANALYSIS');
        console.log('-'.repeat(80));

        const allClients = await prisma.client.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                firmId: true,
                isActive: true,
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log(`Total Clients in Database: ${allClients.length}\n`);

        allClients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.name}`);
            console.log(`   Email: ${client.email}`);
            console.log(`   Active: ${client.isActive}`);
            console.log(`   Users Count: ${client._count.users}`);
            console.log(`   FirmId: ${client.firmId}`);
        });

        // 3. FIRMS TABLE ANALYSIS
        console.log('\n\n3. FIRMS TABLE ANALYSIS');
        console.log('-'.repeat(80));

        const allFirms = await prisma.firm.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        users: true,
                        clients: true,
                    },
                },
            },
        });

        console.log(`Total Firms in Database: ${allFirms.length}\n`);

        allFirms.forEach((firm, index) => {
            console.log(`${index + 1}. ${firm.name}`);
            console.log(`   Email: ${firm.email}`);
            console.log(`   Users Count: ${firm._count.users}`);
            console.log(`   Clients Count: ${firm._count.clients}`);
            console.log(`   FirmId: ${firm.id}`);
        });

        // 4. RELATIONSHIP ANALYSIS
        console.log('\n\n4. RELATIONSHIP ANALYSIS');
        console.log('-'.repeat(80));

        // Users with clientId set
        const usersWithClientId = allUsers.filter(u => u.clientId !== null);
        console.log(`\nUsers with clientId set: ${usersWithClientId.length}`);
        usersWithClientId.forEach((user) => {
            console.log(`  - ${user.email} (${user.role}) -> clientId: ${user.clientId}`);
        });

        // Users without clientId
        const usersWithoutClientId = allUsers.filter(u => u.clientId === null);
        console.log(`\nUsers without clientId: ${usersWithoutClientId.length}`);
        usersWithoutClientId.forEach((user) => {
            console.log(`  - ${user.email} (${user.role})`);
        });

        // 5. DASHBOARD COUNTS (What Admin Dashboard Shows)
        console.log('\n\n5. DASHBOARD COUNTS (What Admin Dashboard Shows)');
        console.log('-'.repeat(80));

        const firmId = allFirms[0]?.id; // Assuming single firm

        if (firmId) {
            const caCount = await prisma.user.count({
                where: { firmId, role: 'CA', isActive: true },
            });

            const traineeCount = await prisma.user.count({
                where: { firmId, role: 'TRAINEE', isActive: true },
            });

            const clientCount = await prisma.user.count({
                where: { firmId, role: 'CLIENT', isActive: true },
            });

            const clientsTableCount = await prisma.client.count({
                where: { firmId, isActive: true },
            });

            console.log(`\nDashboard Stats for Firm: ${allFirms[0].name}`);
            console.log(`  Total CAs (from users table): ${caCount}`);
            console.log(`  Total Trainees (from users table): ${traineeCount}`);
            console.log(`  Total Clients (from users table): ${clientCount}`);
            console.log(`  Total Clients (from clients table): ${clientsTableCount}`);
        }

        // 6. PROBLEM IDENTIFICATION
        console.log('\n\n6. PROBLEM IDENTIFICATION');
        console.log('-'.repeat(80));

        // Check for orphaned users
        const orphanedUsers = await prisma.user.findMany({
            where: {
                clientId: {
                    not: null,
                },
            },
            include: {
                client: true,
            },
        });

        const actualOrphans = orphanedUsers.filter(u => !u.client);
        if (actualOrphans.length > 0) {
            console.log(`\n⚠️  Found ${actualOrphans.length} orphaned users (clientId set but client doesn't exist):`);
            actualOrphans.forEach(u => {
                console.log(`  - ${u.email} (${u.role}) -> clientId: ${u.clientId}`);
            });
        } else {
            console.log('\n✓ No orphaned users found');
        }

        // Check for duplicate emails
        const emailCounts = allUsers.reduce((acc, user) => {
            acc[user.email] = (acc[user.email] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1);
        if (duplicateEmails.length > 0) {
            console.log(`\n⚠️  Found ${duplicateEmails.length} duplicate emails:`);
            duplicateEmails.forEach(([email, count]) => {
                console.log(`  - ${email} (${count} times)`);
            });
        } else {
            console.log('✓ No duplicate emails found');
        }

        console.log('\n\n' + '='.repeat(80));
        console.log('END OF ANALYSIS');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error analyzing database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeDatabase();
