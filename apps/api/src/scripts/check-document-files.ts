import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkDocumentFiles() {
    const docs = await prisma.document.findMany({
        where: { isDeleted: false },
        include: { client: { select: { name: true } } }
    });

    console.log(`Found ${docs.length} documents\n`);

    docs.forEach((doc) => {
        console.log('---');
        console.log('File:', doc.fileName);
        console.log('Client:', doc.client?.name);
        console.log('Storage Path:', doc.storagePath);

        const fullPath = path.join(process.cwd(), doc.storagePath);
        console.log('Full Path:', fullPath);
        console.log('Exists:', fs.existsSync(fullPath));

        if (!fs.existsSync(fullPath)) {
            console.log('❌ FILE NOT FOUND!');
            // Check if directory exists
            const dir = path.dirname(fullPath);
            console.log('Directory:', dir);
            console.log('Directory exists:', fs.existsSync(dir));

            // List files in directory if it exists
            if (fs.existsSync(dir)) {
                console.log('Files in directory:', fs.readdirSync(dir));
            }
        } else {
            console.log('✅ File exists');
        }
    });

    await prisma.$disconnect();
}

checkDocumentFiles();
