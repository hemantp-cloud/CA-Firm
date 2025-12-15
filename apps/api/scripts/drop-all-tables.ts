import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dropAllTables() {
    console.log('🗑️  Dropping all tables and types...\n');

    try {
        const statements = [
            'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE',
            'DROP TABLE IF EXISTS "activity_logs" CASCADE',
            'DROP TABLE IF EXISTS "settings" CASCADE',
            'DROP TABLE IF EXISTS "client_assignments" CASCADE',
            'DROP TABLE IF EXISTS "payments" CASCADE',
            'DROP TABLE IF EXISTS "invoice_items" CASCADE',
            'DROP TABLE IF EXISTS "invoices" CASCADE',
            'DROP TABLE IF EXISTS "documents" CASCADE',
            'DROP TABLE IF EXISTS "tasks" CASCADE',
            'DROP TABLE IF EXISTS "services" CASCADE',
            'DROP TABLE IF EXISTS "clients" CASCADE',
            'DROP TABLE IF EXISTS "team_members" CASCADE',
            'DROP TABLE IF EXISTS "project_managers" CASCADE',
            'DROP TABLE IF EXISTS "admins" CASCADE',
            'DROP TABLE IF EXISTS "super_admins" CASCADE',
            'DROP TABLE IF EXISTS "users" CASCADE',
            'DROP TABLE IF EXISTS "firms" CASCADE',
            'DROP TYPE IF EXISTS "Role" CASCADE',
            'DROP TYPE IF EXISTS "Role_old" CASCADE',
            'DROP TYPE IF EXISTS "ServiceStatus" CASCADE',
            'DROP TYPE IF EXISTS "ServiceType" CASCADE',
            'DROP TYPE IF EXISTS "InvoiceStatus" CASCADE',
            'DROP TYPE IF EXISTS "DocumentType" CASCADE',
            'DROP TYPE IF EXISTS "DocumentStatus" CASCADE',
            'DROP TYPE IF EXISTS "PaymentMethod" CASCADE',
            'DROP TYPE IF EXISTS "PaymentStatus" CASCADE',
        ];

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                console.log(`✓ ${statement}`);
            } catch (error: any) {
                // Ignore errors for non-existent tables/types
                if (!error.message.includes('does not exist')) {
                    console.log(`⚠ ${statement} - ${error.message}`);
                }
            }
        }

        console.log('\n✅ All tables and types dropped successfully!\n');
        console.log('Now run: npx prisma db push\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

dropAllTables()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
