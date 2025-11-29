
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
    console.log('Checking for admin user...');
    const user = await prisma.user.findFirst({
        where: {
            email: 'admin@cafirm.com'
        }
    });

    if (user) {
        console.log('✅ Admin user found:', user.email);
        console.log('Role:', user.role);
        console.log('Active:', user.isActive);
    } else {
        console.log('❌ Admin user NOT found');
        const allUsers = await prisma.user.findMany();
        console.log('Total users in DB:', allUsers.length);
        if (allUsers.length > 0) {
            console.log('Existing users:', allUsers.map(u => u.email));
        }
    }
}

checkAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
