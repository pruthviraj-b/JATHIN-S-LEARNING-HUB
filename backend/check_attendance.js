const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttendance() {
    // 1. Find Developer
    const s = await prisma.student.findFirst({
        where: { firstName: { contains: 'dev', mode: 'insensitive' } }
    });

    if (!s) {
        console.log('Developer student not found');
        return;
    }
    console.log(`Student: ${s.firstName} (ID: ${s.id})`);

    // 2. Find Attendance
    const records = await prisma.attendance.findMany({
        where: { studentId: s.id },
        orderBy: { date: 'desc' }
    });

    console.log(`\nFound ${records.length} attendance records:`);
    records.forEach(r => {
        console.log(` - Date: ${r.date.toISOString()} | Present: ${r.present} | MarkedAt: ${r.markedAt?.toISOString()}`);
    });
}

checkAttendance().finally(() => prisma.$disconnect());
