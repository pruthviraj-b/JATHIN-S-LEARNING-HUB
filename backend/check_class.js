const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClass() {
    const s = await prisma.student.findFirst({
        where: { firstName: { contains: 'dev', mode: 'insensitive' } }
    });
    console.log(`Student: ${s.firstName}, Class: ${s.classLevel}`);

    const subjects = await prisma.subject.findMany({
        where: { classLevel: s.classLevel }
    });
    console.log(`Subjects found in DB for Class ${s.classLevel}: ${subjects.length}`);
}

checkClass().finally(() => prisma.$disconnect());
