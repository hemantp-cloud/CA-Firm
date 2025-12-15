const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showDatabaseContents() {
    console.log('\n' + '='.repeat(100));
    console.log('CURRENT DATABASE CONTENTS - DETAILED VIEW');
    console.log('='.repeat(100) + '\n');

    try {
        // Get firm info
        const firms = await prisma.firm.findMany();
        const firmId = firms[0]?.id;

        console.log('📊 FIRM INFORMATION');
        console.log('-'.repeat(100));
        firms.forEach(firm => {
            console.log(`Firm Name: ${firm.name}`);
            console.log(`Firm Email: ${firm.email}`);
            console.log(`Firm ID: ${firm.id}\n`);
        });

        // Get all users
        console.log('\n👥 USERS TABLE (All Accounts)');
        console.log('-'.repeat(100));
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'asc' },
            select: {
                email: true,
                name: true,
                role: true,
                clientId: true,
                isActive: true,
                createdAt: true,
            },
        });

        console.log(`Total users in database: ${users.length}\n`);

        const roleGroups = {
            ADMIN: [],
            CA: [],
            TRAINEE: [],
            CLIENT: [],
        };

        users.forEach(user => {
            if (roleGroups[user.role]) {
                roleGroups[user.role].push(user);
            }
        });

        // Show each role group
        Object.entries(roleGroups).forEach(([role, userList]) => {
            if (userList.length > 0) {
                console.log(`\n${role} (${userList.length} user${userList.length > 1 ? 's' : ''}):`);
                userList.forEach((user, index) => {
                    console.log(`  ${index + 1}. ${user.email}`);
                    console.log(`     Name: ${user.name}`);
                    console.log(`     ClientId: ${user.clientId || 'NULL'}`);
                    console.log(`     Active: ${user.isActive}`);
                    console.log(`     Created: ${user.createdAt.toISOString().split('T')[0]}`);
                });
            }
        });

        // Get all clients
        console.log('\n\n🏢 CLIENTS TABLE (CA Partner Firms)');
        console.log('-'.repeat(100));
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'asc' },
            select: {
                name: true,
                email: true,
                isActive: true,
                commission: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        console.log(`Total clients in database: ${clients.length}\n`);

        if (clients.length > 0) {
            clients.forEach((client, index) => {
                console.log(`${index + 1}. ${client.name}`);
                console.log(`   Email: ${client.email}`);
                console.log(`   Active: ${client.isActive}`);
                console.log(`   Commission: ${client.commission || 'N/A'}%`);
                console.log(`   Users linked: ${client._count.users}`);
                console.log(`   Created: ${client.createdAt.toISOString().split('T')[0]}`);
            });
        } else {
            console.log('No clients found in database.');
        }

        // Dashboard statistics
        console.log('\n\n📈 DASHBOARD STATISTICS (What Admin Dashboard Shows)');
        console.log('-'.repeat(100));

        if (firmId) {
            const stats = {
                totalCAs: await prisma.user.count({
                    where: { firmId, role: 'CA', isActive: true },
                }),
                totalTrainees: await prisma.user.count({
                    where: { firmId, role: 'TRAINEE', isActive: true },
                }),
                totalClients: await prisma.user.count({
                    where: { firmId, role: 'CLIENT', isActive: true },
                }),
                totalAdmins: await prisma.user.count({
                    where: { firmId, role: 'ADMIN', isActive: true },
                }),
                inactiveUsers: await prisma.user.count({
                    where: { firmId, isActive: false },
                }),
            };

            console.log(`\nActive Users by Role:`);
            console.log(`  • Admins: ${stats.totalAdmins}`);
            console.log(`  • CAs: ${stats.totalCAs}`);
            console.log(`  • Trainees: ${stats.totalTrainees}`);
            console.log(`  • Clients: ${stats.totalClients}`);
            console.log(`\nInactive Users: ${stats.inactiveUsers}`);
        }

        // Your 4 created users
        console.log('\n\n✅ YOUR MANUALLY CREATED USERS');
        console.log('-'.repeat(100));

        const yourUsers = [
            'hemant.p@10x.in',
            '100hemantpandey@gmail.com',
            'hemant.rd21.153.0029@rdec.in',
            '100shashankshekhar@gmail.com',
        ];

        for (const email of yourUsers) {
            const user = await prisma.user.findFirst({
                where: { email },
                select: {
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    clientId: true,
                },
            });

            if (user) {
                console.log(`✓ ${email}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Name: ${user.name}`);
                console.log(`  Active: ${user.isActive}`);
                console.log(`  ClientId: ${user.clientId || 'NULL'}`);
            } else {
                console.log(`✗ ${email} - NOT FOUND IN DATABASE`);
            }
        }

        // Check for extra users
        console.log('\n\n⚠️  EXTRA USERS (Not in your list of 4)');
        console.log('-'.repeat(100));

        const extraUsers = await prisma.user.findMany({
            where: {
                email: {
                    notIn: yourUsers,
                },
            },
            select: {
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        if (extraUsers.length > 0) {
            console.log(`Found ${extraUsers.length} extra user(s):\n`);
            extraUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`);
            });
            console.log('\n💡 These might be from seed data or previous testing.');
        } else {
            console.log('✓ No extra users found. Database only contains your 4 users.');
        }

        console.log('\n' + '='.repeat(100));
        console.log('END OF REPORT');
        console.log('='.repeat(100) + '\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

showDatabaseContents();
