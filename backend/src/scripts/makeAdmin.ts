import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        const user = await prisma.user.update({
            where: {
                email: 'achintha.gh@gmail.com',
            },
            data: {
                role: 'ADMIN',
            },
        });

        console.log('✅ User updated successfully:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
