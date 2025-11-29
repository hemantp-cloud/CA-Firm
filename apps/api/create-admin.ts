
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    console.log('Creating admin user...');

    // Find existing firm
    const firm = await prisma.firm.findFirst({
        where: {
            email: 'info@cafirm.com'
        }
    });

    if (!firm) {
        console.error('❌ Firm info@cafirm.com not found. Please run seed script properly or check DB.');
        return;
    }

    console.log(`✅ Found firm: ${firm.name} (${firm.id})`);

    // Check if admin user exists
    const existingUser = await prisma.user.findFirst({
        where: {
            email: 'admin@cafirm.com'
        }
    });

    if (existingUser) {
        console.log('✅ Admin user already exists.');
        return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const caUser = await prisma.user.create({
        data: {
            firmId: firm.id,
            clientId: null,
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

    console.log(`✅ Created CA user: ${caUser.email}`);
    console.log('Login with: admin@cafirm.com / Admin@123');
}

createAdmin()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
