import prisma from '../shared/utils/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

async function main() {
    console.log('🌱 Starting test users seed...\n');

    // 1. Get or Create Firm
    let firm = await prisma.firm.findFirst({
        where: { email: 'info@guptaca.com' }
    });

    if (!firm) {
        console.log('📋 Creating Gupta CA Firm...');
        firm = await prisma.firm.create({
            data: {
                name: 'Gupta CA Firm',
                email: 'info@guptaca.com',
                phone: '+91-9876543210',
                address: 'Delhi',
            },
        });
    }
    console.log(`✅ Firm: ${firm.name}\n`);

    // 2. Create ADMIN User
    console.log('👤 Creating ADMIN: Mr. Gupta...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { firmId_email: { firmId: firm.id, email: 'admin@guptaca.com' } },
        update: {
            password: adminPassword,
            role: Role.ADMIN,
            name: 'Mr. Gupta',
        },
        create: {
            firmId: firm.id,
            email: 'admin@guptaca.com',
            name: 'Mr. Gupta',
            role: Role.ADMIN,
            password: adminPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created ADMIN: ${admin.email}\n`);

    // 3. Create Partners (Client Entities for CAs)
    console.log('🏢 Creating Partners...');

    // Sharma Partner Entity
    const sharmaPartner = await prisma.client.create({
        data: {
            firmId: firm.id,
            name: 'Sharma Associates',
            email: 'sharma.partner@guptaca.com',
            isActive: true,
        },
    });

    // Patel Partner Entity
    const patelPartner = await prisma.client.create({
        data: {
            firmId: firm.id,
            name: 'Patel Consultants',
            email: 'patel.partner@guptaca.com',
            isActive: true,
        },
    });

    // 4. Create CA Users
    console.log('👤 Creating CA Users...');
    const caPassword = await bcrypt.hash('ca123', 10);

    // Mr. Sharma
    const sharma = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: sharmaPartner.id,
            email: 'sharma@guptaca.com',
            name: 'Mr. Sharma',
            role: Role.CA,
            password: caPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created CA: ${sharma.email}`);

    // Mr. Patel
    const patel = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: patelPartner.id,
            email: 'patel@guptaca.com',
            name: 'Mr. Patel',
            role: Role.CA,
            password: caPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created CA: ${patel.email}\n`);

    // 5. Create CLIENT Users
    console.log('👥 Creating CLIENT Users...');
    const clientPassword = await bcrypt.hash('client123', 10);

    // Rahul (Assigned to Sharma)
    const rahul = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: sharmaPartner.id,
            email: 'rahul@gmail.com',
            name: 'Rahul Kumar',
            role: Role.CLIENT,
            password: clientPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created CLIENT: ${rahul.email} (Assigned to Sharma)`);

    // Priya (Assigned to Sharma)
    const priya = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: sharmaPartner.id,
            email: 'priya@gmail.com',
            name: 'Priya Singh',
            role: Role.CLIENT,
            password: clientPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created CLIENT: ${priya.email} (Assigned to Sharma)`);

    // Amit (Assigned to Patel)
    const amit = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: patelPartner.id,
            email: 'amit@gmail.com',
            name: 'Amit Verma',
            role: Role.CLIENT,
            password: clientPassword,
            emailVerified: true,
        },
    });
    console.log(`✅ Created CLIENT: ${amit.email} (Assigned to Patel)\n`);

    console.log('🎉 Test users seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding test users:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
