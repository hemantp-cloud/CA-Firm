import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

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

  // 2. Create or Update CA user (super admin)
  console.log('👤 Creating/Updating CA user...');
  const hashedPassword = await bcrypt.hash('Pandey3466@', 10);

  const caUser = await prisma.user.upsert({
    where: {
      firmId_email: {
        firmId: firm.id,
        email: 'hemant.p@10x.in',
      },
    },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      firmId: firm.id,
    },
    create: {
      firmId: firm.id,
      clientId: null, // CA has no clientId
      email: 'hemant.p@10x.in',
      password: hashedPassword,
      name: 'CA Admin',
      role: 'ADMIN',
      twoFactorEnabled: true,
      mustChangePassword: false,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ CA user ready: ${caUser.email}\n`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Firm: ${firm.name}`);
  console.log(`   - Admin User: ${caUser.email}`);
  console.log('\n🔐 Login Credentials:');
  console.log(`   Email: hemant.p@10x.in`);
  console.log(`   Password: Pandey3466@`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

