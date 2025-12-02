import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocuments() {
    try {
        const documents = await prisma.document.findMany({
            select: {
                id: true,
                fileName: true,
                storagePath: true,
                uploadedAt: true,
                user: {
                    select: {
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: 'desc',
            },
        });

        console.log('Total documents:', documents.length);
        console.log('\nDocument details:');
        documents.forEach((doc, index) => {
            console.log(`\n${index + 1}. ${doc.fileName}`);
            console.log(`   User: ${doc.user.name} (${doc.user.role})`);
            console.log(`   Storage Path: ${doc.storagePath}`);
            console.log(`   Uploaded: ${doc.uploadedAt}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDocuments();
