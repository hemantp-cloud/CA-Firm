import prisma from '../shared/utils/prisma';

async function clearOTPs() {
    try {
        console.log('🧹 Clearing all OTPs from database...\n');

        const result = await prisma.user.updateMany({
            data: {
                otpCode: null,
                otpExpiry: null,
            } as any,
        });

        console.log(`✅ Cleared OTPs for ${result.count} users\n`);
        console.log('🎯 You can now login fresh and use the new OTP!\n');

    } catch (error) {
        console.error('❌ Error clearing OTPs:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearOTPs();
