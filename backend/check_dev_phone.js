const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhone() {
    const students = await prisma.student.findMany({
        where: {
            OR: [
                { firstName: { contains: 'Dev', mode: 'insensitive' } },
                { lastName: { contains: 'Dev', mode: 'insensitive' } }
            ]
        }
    });

    console.log('--- DB RESULTS ---');
    students.forEach(s => {
        console.log(`Name: ${s.firstName} ${s.lastName}`);
        console.log(`Phone: ${s.phoneNumber}`); // Should be 919740634537
        console.log('----------------');
    });
}

checkPhone().finally(() => prisma.$disconnect());
