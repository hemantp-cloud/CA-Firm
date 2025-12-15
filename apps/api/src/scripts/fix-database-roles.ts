import prisma from '../shared/utils/prisma';

async function fixDatabaseRoles() {
    try {
        console.log('\n🔍 Analyzing database...\n');

        // Find CA users that have a clientId (these should NOT have clientId)
        const wrongCAUsers = await prisma.user.findMany({
            where: {
                role: 'CA' as any,
                clientId: {
                    not: null,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                clientId: true,
            },
        });

        console.log(`Found ${wrongCAUsers.length} CA users with clientId (should be NULL)\n`);

        if (wrongCAUsers.length > 0) {
            for (const user of wrongCAUsers) {
                console.log(`Fixing: ${user.name} (${user.email})`);
                console.log(`  Setting clientId to NULL...`);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { clientId: null },
                });

                console.log(`  ✅ Fixed!\n`);
            }
        }

        // Now check final counts
        console.log('\n📊 Final User Counts:\n');

        const users = await prisma.user.findMany({
            select: {
                role: true,
                isActive: true,
            },
        });

        const adminCount = users.filter(u => u.role === 'ADMIN' && u.isActive).length;
        const caCount = users.filter(u => u.role === 'CA' && u.isActive).length;
        const traineeCount = users.filter(u => u.role === 'TRAINEE' && u.isActive).length;
        const clientCount = users.filter(u => u.role === 'CLIENT' && u.isActive).length;

        console.log(`ADMIN: ${adminCount}`);
        console.log(`CA: ${caCount}`);
        console.log(`TRAINEE: ${traineeCount}`);
        console.log(`CLIENT: ${clientCount}`);

        console.log(`\n✅ Database fixed successfully!\n`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixDatabaseRoles();
