import prisma from '../shared/utils/prisma';
import bcrypt from 'bcrypt';

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

  // 2. Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: adminPassword,
    } as any,
  });
  console.log(`✅ Created admin user: ${adminUser.email}\n`);

  // 3. Create CA user
  console.log('👤 Creating CA user...');
  const caPassword = await bcrypt.hash('ca123', 10);
  const caUser = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: 'ca@demo.com',
      name: 'CA User',
      role: 'CA',
      password: caPassword,
    } as any,
  });
  console.log(`✅ Created CA user: ${caUser.email}\n`);

  // 4. Create 5 sample clients
  console.log('👥 Creating sample clients...');
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Rajesh Kumar',
        clientType: 'INDIVIDUAL',
        email: 'rajesh@tech.com',
        phone: '+91-9876543211',
        pan: 'ABCDE1234F',
        address: '456 Residential Avenue, Bangalore',
        riskLevel: 'LOW',
      },
    }),
    prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Tech Solutions Pvt Ltd',
        clientType: 'PVT_LTD',
        email: 'contact@techsolutions.com',
        phone: '+91-9876543212',
        pan: 'TECHS1234P',
        gstin: '27TECHS1234P1Z5',
        address: '789 Corporate Tower, Sector 18, Noida',
        riskLevel: 'MEDIUM',
      },
    }),
    prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Legal Partners LLP',
        clientType: 'LLP',
        email: 'info@legalpartners.com',
        phone: '+91-9876543213',
        pan: 'LEGAL1234L',
        gstin: '27LEGAL1234L1Z6',
        address: '321 Law Street, Connaught Place, New Delhi',
        riskLevel: 'LOW',
      },
    }),
    prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Sharma & Associates',
        clientType: 'PARTNERSHIP',
        email: 'sharma@associates.com',
        phone: '+91-9876543214',
        pan: 'SHARM1234P',
        address: '654 Partnership Lane, Pune',
        riskLevel: 'MEDIUM',
      },
    }),
    prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Green Trust Foundation',
        clientType: 'TRUST',
        email: 'contact@greentrust.org',
        phone: '+91-9876543215',
        pan: 'TRUST1234T',
        address: '987 Trust Building, Hyderabad',
        riskLevel: 'HIGH',
      },
    }),
  ]);
  console.log(`✅ Created ${clients.length} clients\n`);

  // 5. Create 3 service types
  console.log('🔧 Creating service types...');
  const serviceTypes = await Promise.all([
    prisma.serviceType.create({
      data: {
        firmId: firm.id,
        name: 'ITR Filing',
        category: 'Tax Compliance',
        description: 'Income Tax Return Filing Services',
        defaultFee: 5000.00,
        estimatedDays: 30,
      },
    }),
    prisma.serviceType.create({
      data: {
        firmId: firm.id,
        name: 'GST Return',
        category: 'Tax Compliance',
        description: 'GST Return Filing Services',
        defaultFee: 3000.00,
        estimatedDays: 15,
      },
    }),
    prisma.serviceType.create({
      data: {
        firmId: firm.id,
        name: 'Company Registration',
        category: 'Corporate Services',
        description: 'Company Incorporation and Registration',
        defaultFee: 15000.00,
        estimatedDays: 45,
      },
    }),
  ]);
  console.log(`✅ Created ${serviceTypes.length} service types\n`);

  // 6. Create 5 sample services linked to clients
  console.log('📦 Creating sample services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        firmId: firm.id,
        clientId: clients[0].id,
        serviceTypeId: serviceTypes[0].id,
        title: 'ITR Filing FY 2023-24',
        status: 'IN_PROGRESS',
        dueDate: new Date('2024-07-31'),
        internalDeadline: new Date('2024-07-25'),
        feeAmount: 5000.00,
        assignedToId: caUser.id,
      },
    }),
    prisma.service.create({
      data: {
        firmId: firm.id,
        clientId: clients[1].id,
        serviceTypeId: serviceTypes[1].id,
        title: 'GST Return - October 2024',
        status: 'AWAITING_CLIENT',
        dueDate: new Date('2024-11-20'),
        internalDeadline: new Date('2024-11-15'),
        feeAmount: 3000.00,
        assignedToId: caUser.id,
      },
    }),
    prisma.service.create({
      data: {
        firmId: firm.id,
        clientId: clients[2].id,
        serviceTypeId: serviceTypes[2].id,
        title: 'LLP Registration',
        status: 'NOT_STARTED',
        dueDate: new Date('2024-12-31'),
        internalDeadline: new Date('2024-12-20'),
        feeAmount: 15000.00,
        assignedToId: adminUser.id,
      },
    }),
    prisma.service.create({
      data: {
        firmId: firm.id,
        clientId: clients[3].id,
        serviceTypeId: serviceTypes[0].id,
        title: 'ITR Filing FY 2023-24',
        status: 'READY_FOR_REVIEW',
        dueDate: new Date('2024-07-31'),
        internalDeadline: new Date('2024-07-25'),
        feeAmount: 5000.00,
        assignedToId: caUser.id,
      },
    }),
    prisma.service.create({
      data: {
        firmId: firm.id,
        clientId: clients[4].id,
        serviceTypeId: serviceTypes[1].id,
        title: 'GST Return - September 2024',
        status: 'COMPLETED',
        dueDate: new Date('2024-10-20'),
        internalDeadline: new Date('2024-10-15'),
        feeAmount: 3000.00,
        assignedToId: adminUser.id,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services\n`);

  // 7. Create 10 sample tasks for services with different statuses
  console.log('✅ Creating sample tasks...');
  const tasks = await Promise.all([
    // Tasks for service 0 (ITR Filing - IN_PROGRESS)
    prisma.serviceTask.create({
      data: {
        serviceId: services[0].id,
        title: 'Collect TDS Certificates',
        description: 'Gather all TDS certificates from client',
        taskOrder: 1,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2024-07-10'),
      },
    }),
    prisma.serviceTask.create({
      data: {
        serviceId: services[0].id,
        title: 'Verify Income Documents',
        description: 'Verify salary slips and other income documents',
        taskOrder: 2,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-07-15'),
      },
    }),
    prisma.serviceTask.create({
      data: {
        serviceId: services[0].id,
        title: 'File ITR Online',
        description: 'Complete and file ITR on income tax portal',
        taskOrder: 3,
        status: 'TO_DO',
        priority: 'HIGH',
        dueDate: new Date('2024-07-25'),
      },
    }),

    // Tasks for service 1 (GST Return - AWAITING_CLIENT)
    prisma.serviceTask.create({
      data: {
        serviceId: services[1].id,
        title: 'Collect GST Invoices',
        description: 'Request all GST invoices from client',
        taskOrder: 1,
        status: 'TO_DO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-11-05'),
      },
    }),
    prisma.serviceTask.create({
      data: {
        serviceId: services[1].id,
        title: 'Reconcile GSTR-2A',
        description: 'Reconcile with GSTR-2A data',
        taskOrder: 2,
        status: 'TO_DO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-11-10'),
      },
    }),

    // Tasks for service 2 (Company Registration - NOT_STARTED)
    prisma.serviceTask.create({
      data: {
        serviceId: services[2].id,
        title: 'DIN Application',
        description: 'Apply for Director Identification Number',
        taskOrder: 1,
        status: 'TO_DO',
        priority: 'HIGH',
        dueDate: new Date('2024-12-05'),
      },
    }),

    // Tasks for service 3 (ITR Filing - READY_FOR_REVIEW)
    prisma.serviceTask.create({
      data: {
        serviceId: services[3].id,
        title: 'Prepare ITR Draft',
        description: 'Prepare draft ITR for review',
        taskOrder: 1,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2024-07-20'),
      },
    }),
    prisma.serviceTask.create({
      data: {
        serviceId: services[3].id,
        title: 'Review ITR',
        description: 'Review ITR for accuracy',
        taskOrder: 2,
        status: 'REVIEW',
        priority: 'HIGH',
        dueDate: new Date('2024-07-22'),
      },
    }),

    // Tasks for service 4 (GST Return - COMPLETED)
    prisma.serviceTask.create({
      data: {
        serviceId: services[4].id,
        title: 'File GSTR-3B',
        description: 'File monthly GSTR-3B return',
        taskOrder: 1,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2024-10-20'),
      },
    }),
    prisma.serviceTask.create({
      data: {
        serviceId: services[4].id,
        title: 'Send Acknowledgment',
        description: 'Send filing acknowledgment to client',
        taskOrder: 2,
        status: 'DONE',
        priority: 'LOW',
        dueDate: new Date('2024-10-21'),
      },
    }),
  ]);
  console.log(`✅ Created ${tasks.length} tasks\n`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Firm`);
  console.log(`   - 2 Users (Admin & CA)`);
  console.log(`   - ${clients.length} Clients`);
  console.log(`   - ${serviceTypes.length} Service Types`);
  console.log(`   - ${services.length} Services`);
  console.log(`   - ${tasks.length} Tasks`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

