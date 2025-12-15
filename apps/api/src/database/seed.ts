import prisma from '../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { Role, ServiceType, ServiceStatus } from '@prisma/client';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create test firm
  console.log('📋 Creating test firm...');
  const firm = await prisma.firm.create({
    data: {
      name: 'Demo CA Firm',
      email: 'info@democafirm.com',
      phone: '+91-9876543210',
      address: '123 Business Street, Financial District, Mumbai - 400001',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
    },
  });
  console.log(`✅ Created firm: ${firm.name} (ID: ${firm.id})\n`);

  // 2. Create Partner (Client entity acting as CA Branch/Partner)
  console.log('🏢 Creating Partner (Client entity)...');
  const partner = await prisma.client.create({
    data: {
      firmId: firm.id,
      name: 'Sharma & Associates',
      email: 'sharma@associates.com',
      phone: '+91-9876543211',
      address: '456 CA Lane, Mumbai',
      isActive: true,
    },
  });
  console.log(`✅ Created Partner: ${partner.name}\n`);

  // 3. Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      role: Role.ADMIN,
      password: adminPassword,
      emailVerified: true,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}\n`);

  // 4. Create Project Manager user (Linked to Partner)
  console.log('🧑 Creating Project Manager user...');
  const pmPassword = await bcrypt.hash('pm123', 10);
  const pmUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      clientId: partner.id, // Project Manager linked to Partner
      email: 'pm@demo.com',
      name: 'Project Manager User',
      role: Role.PROJECT_MANAGER,
      password: pmPassword,
      emailVerified: true,
    },
  });
  console.log(`✅ Created Project Manager user: ${pmUser.email}\n`);

  // 5. Create CLIENT Users (End Customers linked to CA via Partner)
  console.log('👥 Creating client users (end customers)...');
  const clientPassword = await bcrypt.hash('client123', 10);

  const clientUsers = await Promise.all([
    prisma.user.create({
      data: {
        firmId: firm.id,
        clientId: partner.id,
        email: 'rajesh@tech.com',
        name: 'Rajesh Kumar',
        role: Role.CLIENT,
        password: clientPassword,
        emailVerified: true,
        phone: '+91-9876543212',
      },
    }),
    prisma.user.create({
      data: {
        firmId: firm.id,
        clientId: partner.id,
        email: 'contact@techsolutions.com',
        name: 'Tech Solutions Pvt Ltd',
        role: Role.CLIENT,
        password: clientPassword,
        emailVerified: true,
        phone: '+91-9876543213',
      },
    }),
  ]);
  console.log(`✅ Created ${clientUsers.length} client users\n`);

  // 6. Create Services
  console.log('📦 Creating services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        firmId: firm.id,
        userId: clientUsers[0].id,
        clientId: partner.id,
        title: 'ITR Filing FY 2023-24',
        type: ServiceType.ITR_FILING,
        status: ServiceStatus.IN_PROGRESS,
        dueDate: new Date('2024-07-31'),
        feeAmount: 5000.00,
      },
    }),
    prisma.service.create({
      data: {
        firmId: firm.id,
        userId: clientUsers[1].id,
        clientId: partner.id,
        title: 'GST Return - October 2024',
        type: ServiceType.GST_RETURN,
        status: ServiceStatus.PENDING,
        dueDate: new Date('2024-11-20'),
        feeAmount: 3000.00,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services\n`);

  // 7. Create Tasks
  console.log('✅ Creating tasks...');
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        serviceId: services[0].id,
        title: 'Collect TDS Certificates',
        description: 'Gather all TDS certificates from client',
        status: ServiceStatus.COMPLETED,
        priority: 2, // High
        dueDate: new Date('2024-07-10'),
        assignedToId: pmUser.id,
      },
    }),
    prisma.task.create({
      data: {
        serviceId: services[0].id,
        title: 'File ITR',
        description: 'File the return',
        status: ServiceStatus.IN_PROGRESS,
        priority: 2,
        dueDate: new Date('2024-07-25'),
        assignedToId: pmUser.id,
      },
    }),
  ]);
  console.log(`✅ Created ${tasks.length} tasks\n`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
