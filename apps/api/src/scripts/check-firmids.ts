import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFirmIds() {
    const docs = await prisma.document.findMany();
    console.log('Documents firmIds:', docs.map(d => ({ fileName: d.fileName, firmId: d.firmId })));

    const clients = await prisma.client.findMany();
    console.log('\nClients firmIds:', clients.map(c => ({ name: c.name, firmId: c.firmId })));

    await prisma.$disconnect();
}

checkFirmIds();
