const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceUpdate() {
    console.log('Searching for "developer"...');
    const students = await prisma.student.findMany({
        where: {
            firstName: { equals: 'developer', mode: 'insensitive' }
        }
    });

    if (students.length === 0) {
        console.log('❌ Could not find student "developer"');
        const all = await prisma.student.findMany({ take: 5 });
        console.log('First 5 students:', all.map(s => s.firstName));
        return;
    }

    const target = students[0];
    console.log(`Found: ${target.firstName} (ID: ${target.id})`);

    const updated = await prisma.student.update({
        where: { id: target.id },
        data: { phoneNumber: '919740634537' }
    });

    console.log('✅ UPDATED:', updated);
}

forceUpdate()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
