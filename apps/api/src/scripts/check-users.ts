import prisma from '../shared/utils/prisma';

async function checkUserCounts() {
    try {
        // Get all users grouped by role
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        console.log('\n=== ALL USERS IN DATABASE ===\n');
        users.forEach(user => {
            console.log(`${user.role}: ${user.name} (${user.email}) - Active: ${user.isActive}`);
        });

        console.log('\n=== COUNT BY ROLE ===\n');
        const caCount = users.filter(u => u.role === 'CA' && u.isActive).length;
        const traineeCount = users.filter(u => u.role === 'TRAINEE' && u.isActive).length;
        const clientCount = users.filter(u => u.role === 'CLIENT' && u.isActive).length;
        const adminCount = users.filter(u => u.role === 'ADMIN' && u.isActive).length;

        console.log(`ADMIN: ${adminCount}`);
        console.log(`CA: ${caCount}`);
        console.log(`TRAINEE: ${traineeCount}`);
        console.log(`CLIENT: ${clientCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserCounts();
