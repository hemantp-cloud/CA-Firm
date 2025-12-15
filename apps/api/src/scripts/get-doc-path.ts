import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPath() {
    const doc = await prisma.document.findFirst();
    console.log('Storage Path:', doc?.storagePath);
    await prisma.$disconnect();
}

getPath();
