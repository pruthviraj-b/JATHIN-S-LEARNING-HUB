const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCounts() {
    try {
        const students = await prisma.student.count();
        const users = await prisma.user.count();
        const subjects = await prisma.subject.count();
        const classes = await prisma.class.count();
        const teams = await prisma.team.count();
        const tests = await prisma.test.count();
        const stars = await prisma.star.count();

        console.log('--- DATABASE COUNTS ---');
        console.log(`Users: ${users}`);
        console.log(`Students: ${students}`);
        console.log(`Subjects: ${subjects}`);
        console.log(`Classes: ${classes}`);
        console.log(`Teams: ${teams}`);
        console.log(`Tests: ${tests}`);
        console.log(`Stars: ${stars}`);
        console.log('-----------------------');
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
