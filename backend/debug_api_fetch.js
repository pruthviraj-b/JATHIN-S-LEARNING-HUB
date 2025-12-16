const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mocking the API call logic
async function debugApi() {
    try {
        console.log('--- DEBUGGING API ---');

        // 1. Simulate Login to get Token
        const adminEmail = 'thepruthviraj1984bc@gmail.com'; // Known admin
        const user = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!user) {
            console.log('❌ Admin user not found!');
            return;
        }

        console.log('✅ Admin User Found:', user.email, user.role);

        // 2. Fetch Students as Admin (Simulating GET /api/students)
        // We can't easily fetch via HTTP here without starting server, 
        // so we will execute the EXACT query used in src/routes/students.js

        console.log('Attempting Prisma Query from routes/students.js...');

        const students = await prisma.student.findMany({
            include: {
                subjects: true,
                team: true,
                user: { select: { email: true, role: true } },
                stars: { select: { points: true } }
            }
        });

        console.log(`✅ Query Successful! Found ${students.length} students.`);

        if (students.length > 0) {
            console.log('Sample Student:', JSON.stringify(students[0], null, 2));
        } else {
            console.log('⚠️ Students array is empty.');
        }

    } catch (e) {
        console.error('❌ API/Query Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugApi();
