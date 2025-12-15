import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n========== FIRM & USER AUDIT ==========\n');

    // Get all firms
    const firms = await prisma.firm.findMany({
        select: { id: true, name: true }
    });
    console.log('FIRMS:', firms.length);
    firms.forEach(f => console.log(`  - ${f.id}: ${f.name}`));

    // Get Admin and their firmId
    const admins = await prisma.admin.findMany({
        select: { id: true, email: true, name: true, firmId: true, isActive: true }
    });
    console.log('\nADMINS (firmId):');
    admins.forEach(u => console.log(`  - ${u.email} | firmId: ${u.firmId} | Active: ${u.isActive}`));

    // Get Project Managers with firmId
    const pms = await prisma.projectManager.findMany({
        select: { id: true, email: true, name: true, firmId: true, isActive: true }
    });
    console.log('\nPROJECT MANAGERS (firmId):');
    pms.forEach(u => console.log(`  - ${u.email} | firmId: ${u.firmId} | Active: ${u.isActive}`));

    // Get Team Members with firmId
    const tms = await prisma.teamMember.findMany({
        select: { id: true, email: true, name: true, firmId: true, isActive: true }
    });
    console.log('\nTEAM MEMBERS (firmId):');
    tms.forEach(u => console.log(`  - ${u.email} | firmId: ${u.firmId} | Active: ${u.isActive}`));

    // Get Clients with firmId
    const clients = await prisma.client.findMany({
        select: { id: true, email: true, name: true, firmId: true, isActive: true }
    });
    console.log('\nCLIENTS (firmId):');
    clients.forEach(u => console.log(`  - ${u.email} | firmId: ${u.firmId} | Active: ${u.isActive}`));

    console.log('\n==========================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
