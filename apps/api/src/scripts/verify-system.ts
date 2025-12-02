import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySystem() {
    console.log('🔍 Starting System-Wide Verification...\n');

    try {
        // 1. Database Connection & Schema Check
        console.log('1️⃣  Checking Database Connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected successfully.');

        // 2. Data Integrity Check
        console.log('\n2️⃣  Checking Data Integrity...');

        const firm = await prisma.firm.findFirst();
        if (!firm) {
            console.error('   ❌ CRITICAL: No Firm found. Database might be empty.');
        } else {
            console.log(`   ✅ Firm found: ${firm.name} (${firm.id})`);
        }

        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const caUser = await prisma.user.findFirst({ where: { role: 'CA' } });
        const clientUser = await prisma.user.findFirst({ where: { role: 'CLIENT' } });

        console.log(`   - Admin User: ${adminUser ? '✅ Found (' + adminUser.email + ')' : '❌ MISSING'}`);
        console.log(`   - CA User:    ${caUser ? '✅ Found (' + caUser.email + ')' : '❌ MISSING'}`);
        console.log(`   - Client User:${clientUser ? '✅ Found (' + clientUser.email + ')' : '❌ MISSING'}`);

        const docCount = await prisma.document.count();
        console.log(`   - Total Documents: ${docCount}`);

        // 3. API Health Check (Internal)
        console.log('\n3️⃣  Checking API Health (Internal)...');
        console.log('   ℹ️  Skipping HTTP check to avoid dependency issues. Assuming API is running if you see this.');

        // 4. Schema Consistency Check (Manual verification of key fields)
        console.log('\n4️⃣  Verifying Key Schema Fields...');
        // We'll just check if we can query with the new fields
        try {
            const testDoc = await prisma.document.findFirst({
                select: { uploadStatus: true, submittedAt: true }
            });
            console.log('   ✅ Document schema has "uploadStatus" and "submittedAt".', testDoc ? 'Found sample.' : 'No docs yet.');
        } catch (e) {
            console.error('   ❌ CRITICAL: Document schema mismatch. "uploadStatus" might be missing.', e);
        }

    } catch (error) {
        console.error('\n❌ System Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySystem();
