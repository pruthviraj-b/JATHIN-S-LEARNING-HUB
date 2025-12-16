const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugLinkage() {
    const email = 'pruthviraj1984bc@gmail.com';
    console.log(`Checking linkage for: ${email}`);

    // 1. Get User
    const user = await prisma.user.findUnique({
        where: { email },
        include: { student: true } // Relation from User side
    });

    if (!user) {
        console.log('❌ User not found!');
        return;
    }
    console.log(`User ID: ${user.id}`);
    console.log(`User Role: ${user.role}`);
    console.log(`Linked Student via User.student: ${user.student?.firstName || 'NULL'}`);

    // 2. Get Student (by name match)
    const students = await prisma.student.findMany({
        where: {
            firstName: { contains: 'dev', mode: 'insensitive' }
        }
    });

    console.log(`\nFound ${students.length} students with name 'dev':`);
    for (const s of students) {
        const match = s.userId === user.id ? '✅ MATCHES USER' : '❌ NO MATCH';
        console.log(` - Student ID: ${s.id} | Name: ${s.firstName} | Class: ${s.classLevel} | userId Field: ${s.userId} [${match}]`);

        // Check attendance for this specific student ID
        const att = await prisma.attendance.count({ where: { studentId: s.id } });
        console.log(`   > Attendance Records: ${att}`);
    }
}

debugLinkage().finally(() => prisma.$disconnect());
