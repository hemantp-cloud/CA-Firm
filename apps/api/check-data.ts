
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('Checking data...');

    const firms = await prisma.firm.findMany();
    console.log('Firms:', firms.length);
    firms.forEach(f => console.log(`- ${f.name} (${f.email})`));

    const users = await prisma.user.findMany();
    console.log('Users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
}

checkData()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
