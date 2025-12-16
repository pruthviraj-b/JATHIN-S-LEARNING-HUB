const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCreds() {
    const users = await prisma.user.findMany({
        include: { student: true }
    });

    const dev = users.find(u => u.student && u.student.firstName.toLowerCase().includes('dev'));

    if (dev) {
        console.log('--- CREDENTIALS ---');
        console.log(`Email: ${dev.email}`);
        console.log(`Name: ${dev.student.firstName}`);
        console.log('Password: (Likely "123456" as per seed default)');
    } else {
        console.log('Developer user not found.');
    }
}

findCreds().finally(() => prisma.$disconnect());
