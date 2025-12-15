import prisma from '../shared/utils/prisma';

async function listCAUsers() {
    try {
        const caUsers = await prisma.user.findMany({
            where: {
                role: 'CA' as any,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                clientId: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log('\n=== CA USERS IN DATABASE ===\n');
        caUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Client ID: ${user.clientId || 'None'}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listCAUsers();
