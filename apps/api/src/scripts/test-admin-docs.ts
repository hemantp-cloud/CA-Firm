import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminDocuments() {
    try {
        // Simulate Admin user context
        const userContext = {
            id: 'some-admin-id',
            role: 'ADMIN',
            firmId: '1', // Adjust this to match your firm ID
            clientId: null,
        };

        const where: any = {
            firmId: userContext.firmId,
            isDeleted: false,
        };

        // ADMIN should see all documents (no additional filter)
        console.log('Admin filter:', JSON.stringify(where, null, 2));

        const documents = await prisma.document.findMany({
            where,
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

        console.log('\nTotal documents for ADMIN:', documents.length);
        console.log('\nDocuments:');
        documents.forEach((doc) => {
            console.log({
                id: doc.id,
                fileName: doc.fileName,
                clientName: doc.client?.name,
                firmId: doc.firmId,
            });
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAdminDocuments();
