
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany();
    console.log('Services count:', services.length);
    services.forEach(s => console.log(`Service: ${s.title} (${s.id})`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
