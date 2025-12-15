import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Get admin's firmId
    const admin = await prisma.admin.findFirst({
        where: { email: 'admin@gmail.com' },
        select: { firmId: true }
    });
    console.log('Admin firmId:', admin?.firmId);

    // Get all PMs with their firmId
    const pms = await prisma.projectManager.findMany({
        select: { email: true, firmId: true, isActive: true, deletedAt: true }
    });

    console.log('\nAll Project Managers:');
    pms.forEach(pm => {
        const sameFirem = pm.firmId === admin?.firmId ? 'SAME' : 'DIFFERENT';
        console.log(`${pm.email} | firmId: ${pm.firmId?.substring(0, 8)}... | isActive: ${pm.isActive} | deletedAt: ${pm.deletedAt} | ${sameFirem}`);
    });

    // Count with admin's firmId
    if (admin?.firmId) {
        const count = await prisma.projectManager.count({
            where: { firmId: admin.firmId, isActive: true, deletedAt: null }
        });
        console.log('\nPM count with admin firmId filter:', count);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
