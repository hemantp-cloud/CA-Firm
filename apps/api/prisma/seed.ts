import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * DATABASE SEED SCRIPT
 * ====================
 * This script creates the initial Super Admin user for the CA Firm Management System.
 * 
 * IMPORTANT: Before running, update the credentials below:
 * - SUPER_ADMIN_EMAIL: Your Super Admin email
 * - SUPER_ADMIN_PASSWORD: A strong password (change after first login)
 * - SUPER_ADMIN_NAME: Full name of the Super Admin
 */

// ============================================
// CONFIGURE YOUR CREDENTIALS HERE
// ============================================
const SUPER_ADMIN_EMAIL = 'admin@example.com';       // Change this!
const SUPER_ADMIN_PASSWORD = 'YourSecurePassword123!'; // Change this!
const SUPER_ADMIN_NAME = 'Super Admin';              // Change this!

const FIRM_NAME = 'CA Firm Management';
const FIRM_EMAIL = 'info@cafirm.com';
// ============================================

async function main() {
  console.log('🌱 Starting database seed with NEW SCHEMA...\n');

  // 1. Create or Update CA Firm (single tenant)
  console.log('📋 Checking CA Firm...');
  const firm = await prisma.firm.upsert({
    where: { email: FIRM_EMAIL },
    update: {},
    create: {
      name: FIRM_NAME,
      email: FIRM_EMAIL,
      phone: '+91-0000000000',
      address: '123 Business Street, Financial District',
      gstin: '00XXXXX0000X0XX', // Example GSTIN format
      pan: 'XXXXXXXXXX',        // Example PAN format
    },
  });
  console.log(`✅ Firm ready: ${firm.name} (ID: ${firm.id})\n`);

  // 2. Create Super Admin (Main Admin - Owner)
  console.log('👑 Creating Super Admin (Main Admin)...');
  const hashedSuperAdminPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const superAdmin = await prisma.superAdmin.upsert({
    where: {
      email: SUPER_ADMIN_EMAIL,
    },
    update: {
      password: hashedSuperAdminPassword,
      isActive: true,
      firmId: firm.id,
    },
    create: {
      firmId: firm.id,
      email: SUPER_ADMIN_EMAIL,
      password: hashedSuperAdminPassword,
      name: SUPER_ADMIN_NAME,
      twoFactorEnabled: false,
      mustChangePassword: true, // Force password change on first login
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}\n`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Firm: ${firm.name}`);
  console.log(`   - Super Admin: ${superAdmin.email}`);
  console.log('\n🔐 Login Credentials:');
  console.log('\n   SUPER ADMIN (Main Admin):');
  console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: [The password you configured above]`);
  console.log('\n✨ You can now create other users (Admins, Project Managers, Team Members, Clients) from the Super Admin dashboard!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
