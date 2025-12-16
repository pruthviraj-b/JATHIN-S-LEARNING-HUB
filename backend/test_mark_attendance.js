const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMark() {
    const s = await prisma.student.findFirst({
        where: { firstName: { contains: 'dev', mode: 'insensitive' } }
    });

    if (!s) return console.log('Dev student not found');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0); // 9 AM yesterday

    console.log(`Marking attendance for ${s.firstName} on ${yesterday.toISOString()}...`);

    // Simulate Logic from routes/attendance.js
    const targetDate = new Date(yesterday);
    targetDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check/Create
    const existing = await prisma.attendance.findFirst({
        where: {
            studentId: s.id,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    if (existing) {
        console.log('Record already exists (Updating)...');
        await prisma.attendance.update({
            where: { id: existing.id },
            data: { present: true, markedAt: new Date() }
        });
    } else {
        console.log('Creating NEW record...');
        await prisma.attendance.create({
            data: {
                studentId: s.id,
                date: targetDate,
                present: true,
                markedAt: new Date()
            }
        });
    }
    console.log('✅ Marked successfully.');
}

testMark().finally(() => prisma.$disconnect());
