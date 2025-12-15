import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetDatabase() {
    console.log('🔄 Resetting database with new schema...\n');

    try {
        // Step 1: Create Firm
        console.log('📋 Creating firm...');
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
        console.log(`✅ Firm created: ${firm.name} (ID: ${firm.id})\n`);

        // Step 2: Create Super Admin
        console.log('👑 Creating Super Admin...');
        const hashedPassword = await bcrypt.hash('pandey3466@', 10);

        const superAdmin = await prisma.superAdmin.create({
            data: {
                firmId: firm.id,
                email: 'hemant.p10x.in',
                password: hashedPassword,
                name: 'Hemant Pandey',
                emailVerified: true,
                mustChangePassword: false,
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
        console.log('   Email: hemant.p10x.in');
        console.log('   Password: pandey3466@');
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
