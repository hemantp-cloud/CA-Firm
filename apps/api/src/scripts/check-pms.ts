import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pms = await prisma.projectManager.findMany({
        select: { email: true, firmId: true, isActive: true, deletedAt: true }
    });
    console.log('PROJECT MANAGERS:');
    pms.forEach(pm => {
        console.log(`  - ${pm.email}`);
        console.log(`    firmId: ${pm.firmId}`);
        console.log(`    isActive: ${pm.isActive}`);
        console.log(`    deletedAt: ${pm.deletedAt}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
