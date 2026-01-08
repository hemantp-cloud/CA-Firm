import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

/**
 * CREATE SUPER ADMIN SCRIPT
 * =========================
 * This script creates or updates the Super Admin user.
 * 
 * IMPORTANT: Update the credentials below before running!
 */

// ============================================
// CONFIGURE YOUR CREDENTIALS HERE
// ============================================
const SUPER_ADMIN_EMAIL = 'admin@example.com';       // Change this!
const SUPER_ADMIN_PASSWORD = 'YourSecurePassword123!'; // Change this!
const SUPER_ADMIN_NAME = 'Super Admin';              // Change this!
// ============================================

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
                phone: '+91-0000000000',
                address: '123 Business Street',
            },
        });
        console.log(`✅ Firm created: ${firm.id}`);
    } else {
        console.log(`✅ Firm exists: ${firm.id}`);
    }

    // 2. Check if Super Admin exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
        where: { email: SUPER_ADMIN_EMAIL },
    });

    if (existingSuperAdmin) {
        console.log(`✅ Super Admin already exists: ${existingSuperAdmin.email}`);
        console.log(`   ID: ${existingSuperAdmin.id}`);
        console.log(`   isActive: ${existingSuperAdmin.isActive}`);
        console.log(`   Password hash exists: ${!!existingSuperAdmin.password}`);

        // Update password to ensure it's correct
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
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
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

        const superAdmin = await prisma.superAdmin.create({
            data: {
                firmId: firm.id,
                email: SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                name: SUPER_ADMIN_NAME,
                isActive: true,
                emailVerified: true,
                mustChangePassword: true,
                twoFactorEnabled: false,
            },
        });
        console.log(`✅ Super Admin created: ${superAdmin.email}`);
        console.log(`   ID: ${superAdmin.id}`);
    }

    // 3. Verify the user can be found
    console.log('\n🔍 Verifying user lookup...');
    const lookup = await prisma.superAdmin.findUnique({
        where: { email: SUPER_ADMIN_EMAIL },
    });

    if (lookup) {
        console.log('✅ User found successfully!');
        console.log(`   Email: ${lookup.email}`);
        console.log(`   Name: ${lookup.name}`);
        console.log(`   isActive: ${lookup.isActive}`);

        // Test password verification
        const isPasswordValid = await bcrypt.compare(SUPER_ADMIN_PASSWORD, lookup.password);
        console.log(`   Password valid: ${isPasswordValid}`);
    } else {
        console.log('❌ User NOT FOUND!');
    }

    console.log('\n🎉 Done!\n');
    console.log('Login with:');
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log('  Password: [Your configured password]');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
