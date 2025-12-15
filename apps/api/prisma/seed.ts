import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with NEW SCHEMA...\n');

  // 1. Create or Update CA Firm (single tenant)
  console.log('📋 Checking CA Firm...');
  const firm = await prisma.firm.upsert({
    where: { email: 'info@cafirm.com' },
    update: {},
    create: {
      name: 'CA Firm Management',
      email: 'info@cafirm.com',
      phone: '+91-9876543210',
      address: '123 Business Street, Financial District',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
    },
  });
  console.log(`✅ Firm ready: ${firm.name} (ID: ${firm.id})\n`);

  // 2. Create Super Admin (Main Admin - Owner)
  console.log('👑 Creating Super Admin (Main Admin)...');
  const hashedSuperAdminPassword = await bcrypt.hash('pandey3466@', 10);

  const superAdmin = await prisma.superAdmin.upsert({
    where: {
      email: 'hemant.p@10x.in',
    },
    update: {
      password: hashedSuperAdminPassword,
      isActive: true,
      firmId: firm.id,
    },
    create: {
      firmId: firm.id,
      email: 'hemant.p@10x.in',
      password: hashedSuperAdminPassword,
      name: 'Hemant Pandey',
      twoFactorEnabled: false,
      mustChangePassword: false,
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
  console.log(`   Email: hemant.p@10x.in`);
  console.log(`   Password: pandey3466@`);
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
