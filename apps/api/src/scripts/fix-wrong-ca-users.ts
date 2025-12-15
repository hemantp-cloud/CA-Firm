import prisma from '../shared/utils/prisma';

async function fixWrongCAUsers() {
    try {
        // Find CA users that have a clientId (these should be CLIENT role, not CA)
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

        console.log(`\nFound ${wrongCAUsers.length} CA users with clientId (should be CLIENT role)\n`);

        if (wrongCAUsers.length === 0) {
            console.log('No users to fix!');
            process.exit(0);
        }

        // Update each one
        for (const user of wrongCAUsers) {
            console.log(`Fixing: ${user.name} (${user.email})`);
            console.log(`  Changing role from CA to CLIENT...`);

            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'CLIENT' as any },
            });

            console.log(`  ✅ Fixed!\n`);
        }

        console.log(`\n✅ Successfully fixed ${wrongCAUsers.length} user(s)!\n`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixWrongCAUsers();
