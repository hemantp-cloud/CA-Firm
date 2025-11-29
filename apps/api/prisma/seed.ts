import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create CA Firm (single tenant)
  console.log('📋 Creating CA Firm...');
  const firm = await prisma.firm.create({
    data: {
      name: 'CA Firm Management',
      email: 'info@cafirm.com',
      phone: '+91-9876543210',
      address: '123 Business Street, Financial District',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
    },
  });
  console.log(`✅ Created firm: ${firm.name} (ID: ${firm.id})\n`);

  // 2. Create CA user (super admin)
  console.log('👤 Creating CA user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const caUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      clientId: null, // CA has no clientId
      email: 'admin@cafirm.com',
      password: hashedPassword,
      name: 'CA Admin',
      role: 'ADMIN',
      twoFactorEnabled: true,
      mustChangePassword: false,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log(`✅ Created CA user: ${caUser.email}\n`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Firm: ${firm.name}`);
  console.log(`   - 1 CA User: ${caUser.email}`);
  console.log('\n🔐 Login Credentials:');
  console.log(`   Email: admin@cafirm.com`);
  console.log(`   Password: Admin@123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

