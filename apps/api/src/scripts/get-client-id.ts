import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const client = await prisma.client.findFirst({
        where: { email: 'testpmclient@example.com' }
    });
    console.log('Client ID:', client?.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
