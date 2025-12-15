import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocuments() {
    try {
        const documents = await prisma.document.findMany({
            where: {
                isDeleted: false,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        console.log('Total documents:', documents.length);
        console.log('\nDocuments:');
        documents.forEach((doc) => {
            console.log({
                id: doc.id,
                fileName: doc.fileName,
                clientId: doc.clientId,
                clientName: doc.client?.name,
                teamMemberId: doc.teamMemberId,
                uploadedAt: doc.uploadedAt,
            });
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDocuments();
