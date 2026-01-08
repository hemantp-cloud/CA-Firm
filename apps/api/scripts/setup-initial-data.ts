import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * INITIAL DATA SETUP SCRIPT
 * =========================
 * This script resets the database and creates the initial Firm and Super Admin.
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

async function resetDatabase() {
    console.log('🔄 Resetting database with new schema...\n');

    try {
        // Step 1: Create Firm
        console.log('📋 Creating firm...');
        const firm = await prisma.firm.create({
            data: {
                name: 'CA Firm Management',
                email: 'info@cafirm.com',
                phone: '+91-0000000000',
                address: '123 Business Street, Financial District',
                gstin: '00XXXXX0000X0XX', // Example GSTIN format
                pan: 'XXXXXXXXXX',        // Example PAN format
            },
        });
        console.log(`✅ Firm created: ${firm.name} (ID: ${firm.id})\n`);

        // Step 2: Create Super Admin
        console.log('👑 Creating Super Admin...');
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

        const superAdmin = await prisma.superAdmin.create({
            data: {
                firmId: firm.id,
                email: SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                name: SUPER_ADMIN_NAME,
                emailVerified: true,
                mustChangePassword: true, // Force password change on first login
                twoFactorEnabled: false,
                isActive: true,
            },
        });
        console.log(`✅ Super Admin created: ${superAdmin.email}\n`);

        console.log('🎉 Database reset complete!\n');
        console.log('📊 Summary:');
        console.log(`   - Firm: ${firm.name}`);
        console.log(`   - Super Admin: ${superAdmin.email}`);
        console.log('\n🔐 Login Credentials:');
        console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
        console.log('   Password: [Your configured password]');
        console.log('\n✨ You can now login and create other users!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

resetDatabase()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
