import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('🔧 Creating Super Admin directly...\n');

    // 1. Get or create firm
    let firm = await prisma.firm.findFirst();

    if (!firm) {
        console.log('📋 Creating Firm...');
        firm = await prisma.firm.create({
            data: {
                name: 'CA Firm Management',
                email: 'info@cafirm.com',
                phone: '+91-9876543210',
                address: '123 Business Street',
            },
        });
        console.log(`✅ Firm created: ${firm.id}`);
    } else {
        console.log(`✅ Firm exists: ${firm.id}`);
    }

    // 2. Check if Super Admin exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
        where: { email: 'hemant.p10x.in' },
    });

    if (existingSuperAdmin) {
        console.log(`✅ Super Admin already exists: ${existingSuperAdmin.email}`);
        console.log(`   ID: ${existingSuperAdmin.id}`);
        console.log(`   isActive: ${existingSuperAdmin.isActive}`);
        console.log(`   Password hash exists: ${!!existingSuperAdmin.password}`);

        // Update password to ensure it's correct
        const hashedPassword = await bcrypt.hash('pandey3466@', 10);
        await prisma.superAdmin.update({
            where: { id: existingSuperAdmin.id },
            data: {
                password: hashedPassword,
                isActive: true,
            },
        });
        console.log('✅ Password updated!');
    } else {
        console.log('👑 Creating new Super Admin...');
        const hashedPassword = await bcrypt.hash('pandey3466@', 10);

        const superAdmin = await prisma.superAdmin.create({
            data: {
                firmId: firm.id,
                email: 'hemant.p10x.in',
                password: hashedPassword,
                name: 'Hemant Pandey',
                isActive: true,
                emailVerified: true,
                mustChangePassword: false,
                twoFactorEnabled: false,
            },
        });
        console.log(`✅ Super Admin created: ${superAdmin.email}`);
        console.log(`   ID: ${superAdmin.id}`);
    }

    // 3. Verify the user can be found
    console.log('\n🔍 Verifying user lookup...');
    const lookup = await prisma.superAdmin.findUnique({
        where: { email: 'hemant.p10x.in' },
    });

    if (lookup) {
        console.log('✅ User found successfully!');
        console.log(`   Email: ${lookup.email}`);
        console.log(`   Name: ${lookup.name}`);
        console.log(`   isActive: ${lookup.isActive}`);

        // Test password verification
        const testPassword = 'pandey3466@';
        const isPasswordValid = await bcrypt.compare(testPassword, lookup.password);
        console.log(`   Password valid: ${isPasswordValid}`);
    } else {
        console.log('❌ User NOT FOUND!');
    }

    console.log('\n🎉 Done!\n');
    console.log('Login with:');
    console.log('  Email: hemant.p10x.in');
    console.log('  Password: pandey3466@');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
