const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        select: { id: true, firstName: true, lastName: true }
    });

    console.log("--- ALL STUDENTS ---");
    students.forEach(s => {
        console.log(`${s.firstName} ${s.lastName || ''} (ID: ${s.id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
