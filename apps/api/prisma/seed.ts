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

  // 2. Create or Update Admin user
  console.log('👤 Creating/Updating Admin user...');
  const hashedAdminPassword = await bcrypt.hash('Pandey3466@', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      firmId_email: {
        firmId: firm.id,
        email: 'hemant.p@10x.in',
      },
    },
    update: {
      password: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
      firmId: firm.id,
    },
    create: {
      firmId: firm.id,
      clientId: null,
      email: 'hemant.p@10x.in',
      password: hashedAdminPassword,
      name: 'CA Admin',
      role: 'ADMIN',
      twoFactorEnabled: true,
      mustChangePassword: false,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Admin user ready: ${adminUser.email}\n`);

  // 3. Create a test CLIENT user for testing the Client Portal
  console.log('👥 Creating/Updating test Client user...');
  const hashedClientPassword = await bcrypt.hash('Client123@', 10);

  const clientUser = await prisma.user.upsert({
    where: {
      firmId_email: {
        firmId: firm.id,
        email: 'client@test.com',
      },
    },
    update: {
      password: hashedClientPassword,
      role: 'CLIENT',
      isActive: true,
    },
    create: {
      firmId: firm.id,
      clientId: null,
      email: 'client@test.com',
      password: hashedClientPassword,
      name: 'Test Client',
      role: 'CLIENT',
      twoFactorEnabled: false,
      mustChangePassword: false,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Client user ready: ${clientUser.email}\n`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Firm: ${firm.name}`);
  console.log(`   - Admin User: ${adminUser.email}`);
  console.log(`   - Client User: ${clientUser.email}`);
  console.log('\n🔐 Login Credentials:');
  console.log('\n   ADMIN:');
  console.log(`   Email: hemant.p@10x.in`);
  console.log(`   Password: Pandey3466@`);
  console.log('\n   CLIENT (for testing upload):');
  console.log(`   Email: client@test.com`);
  console.log(`   Password: Client123@`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
