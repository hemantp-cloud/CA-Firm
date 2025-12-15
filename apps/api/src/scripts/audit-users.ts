import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n========== DATABASE USER AUDIT ==========\n');

    // Super Admins
    const superAdmins = await prisma.superAdmin.findMany({
        select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('SUPER ADMINS:', superAdmins.length);
    superAdmins.forEach(u => console.log(`  - ${u.email} (${u.name}) - Active: ${u.isActive}`));

    // Admins
    const admins = await prisma.admin.findMany({
        select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('\nADMINS:', admins.length);
    admins.forEach(u => console.log(`  - ${u.email} (${u.name}) - Active: ${u.isActive}`));

    // Project Managers
    const pms = await prisma.projectManager.findMany({
        select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('\nPROJECT MANAGERS:', pms.length);
    pms.forEach(u => console.log(`  - ${u.email} (${u.name}) - Active: ${u.isActive}`));

    // Team Members
    const tms = await prisma.teamMember.findMany({
        select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('\nTEAM MEMBERS:', tms.length);
    tms.forEach(u => console.log(`  - ${u.email} (${u.name}) - Active: ${u.isActive}`));

    // Clients
    const clients = await prisma.client.findMany({
        select: { id: true, email: true, name: true, isActive: true }
    });
    console.log('\nCLIENTS:', clients.length);
    clients.forEach(u => console.log(`  - ${u.email} (${u.name}) - Active: ${u.isActive}`));

    console.log('\n==========================================\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
