import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const superAdmins = await prisma.superAdmin.findMany({ select: { email: true } });
    const admins = await prisma.admin.findMany({ select: { email: true } });
    const pms = await prisma.projectManager.findMany({ select: { email: true } });
    const tms = await prisma.teamMember.findMany({ select: { email: true } });
    const clients = await prisma.client.findMany({ select: { email: true } });

    console.log('SuperAdmins:', superAdmins.map(u => u.email).join(', '));
    console.log('Admins:', admins.map(u => u.email).join(', '));
    console.log('PMs:', pms.map(u => u.email).join(', '));
    console.log('TeamMembers:', tms.map(u => u.email).join(', '));
    console.log('Clients:', clients.map(u => u.email).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
