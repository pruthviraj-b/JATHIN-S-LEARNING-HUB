const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndFix() {
    // 1. Move Developer to Class 8 (So user can test)
    console.log('Moving "Developer" to Class 8...');
    await prisma.student.updateMany({
        where: {
            OR: [
                { firstName: { contains: 'dev', mode: 'insensitive' } },
                { lastName: { contains: 'dev', mode: 'insensitive' } }
            ]
        },
        data: { classLevel: 8 }
    });

    // 2. Remove Class 9 Students
    console.log('Deleting Class 9 students...');
    const deleted = await prisma.student.deleteMany({
        where: { classLevel: 9 }
    });
    console.log(`Deleted ${deleted.count} students from Class 9.`);
}

cleanAndFix().finally(() => prisma.$disconnect());
