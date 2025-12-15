import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.projectManager.count();
    console.log('Total PM count:', count);

    const countWithFilters = await prisma.projectManager.count({
        where: { isActive: true, deletedAt: null }
    });
    console.log('Active PM count (isActive: true, deletedAt: null):', countWithFilters);

    const all = await prisma.projectManager.findMany({
        select: { email: true }
    });
    console.log('All PM emails:', all.map(p => p.email).join(', '));
}
main().catch(console.error).finally(() => prisma.$disconnect());
