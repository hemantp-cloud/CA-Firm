
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.service.deleteMany({});
    console.log('Deleted services:', deleted.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
