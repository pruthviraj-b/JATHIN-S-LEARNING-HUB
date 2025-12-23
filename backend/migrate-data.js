require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create TWO separate Prisma clients with explicit connection URLs
const supabase = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres.xizctbzoqmnmfkhfehbg:80NCVZWHS2VyoctO@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
        }
    },
    log: ['error']
});

const neon = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_zIcLvejWH07i@ep-calm-river-a1it0690-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
        }
    },
    log: ['error']
});

async function migrate() {
    console.log('🚀 Starting complete data migration from Supabase → Neon\n');
    console.log('⏳ This may take a few minutes...\n');

    try {
        // Test connections
        console.log('🔌 Testing database connections...');
        await supabase.$connect();
        await neon.$connect();
        console.log('✅ Both databases connected!\n');

        // 1. Teams (no dependencies)
        console.log('1️⃣  Migrating Teams...');
        const teams = await supabase.team.findMany();
        console.log(`   Found ${teams.length} teams`);
        for (const team of teams) {
            await neon.team.upsert({
                where: { id: team.id },
                create: team,
                update: team
            });
        }
        console.log('   ✅ Done\n');

        // 2. Students (depends on Team)
        console.log('2️⃣  Migrating Students...');
        const students = await supabase.student.findMany();
        console.log(`   Found ${students.length} students`);
        for (const student of students) {
            console.log(`   → ${student.firstName} ${student.lastName}`);
            await neon.student.upsert({
                where: { id: student.id },
                create: student,
                update: student
            });
        }
        console.log('   ✅ Done\n');

        // 3. Users (will link to students later)
        console.log('3️⃣  Migrating Users (without student links)...');
        const users = await supabase.user.findMany();
        console.log(`   Found ${users.length} users`);
        for (const user of users) {
            const { studentId, ...userWithoutStudent } = user;
            await neon.user.upsert({
                where: { id: user.id },
                create: userWithoutStudent,
                update: userWithoutStudent
            });
        }
        console.log('   ✅ Done\n');

        // 4. Link Users → Students
        console.log('4️⃣  Linking Users to Students...');
        const usersWithStudents = users.filter(u => u.studentId);
        console.log(`   Linking ${usersWithStudents.length} user-student pairs`);
        for (const user of usersWithStudents) {
            await neon.user.update({
                where: { id: user.id },
                data: { studentId: user.studentId }
            });
        }
        console.log('   ✅ Done\n');

        // 5. Subjects
        console.log('5️⃣  Migrating Subjects...');
        const subjects = await supabase.subject.findMany();
        console.log(`   Found ${subjects.length} subjects`);
        for (const subject of subjects) {
            await neon.subject.upsert({
                where: { id: subject.id },
                create: subject,
                update: subject
            });
        }
        console.log('   ✅ Done\n');

        // 6. Classes
        console.log('6️⃣  Migrating Classes...');
        const classes = await supabase.class.findMany();
        console.log(`   Found ${classes.length} classes`);
        for (const classItem of classes) {
            await neon.class.upsert({
                where: { id: classItem.id },
                create: classItem,
                update: classItem
            });
        }
        console.log('   ✅ Done\n');

        // 7. Materials
        console.log('7️⃣  Migrating Materials...');
        const materials = await supabase.material.findMany();
        console.log(`   Found ${materials.length} materials`);
        for (const material of materials) {
            await neon.material.upsert({
                where: { id: material.id },
                create: material,
                update: material
            });
        }
        console.log('   ✅ Done\n');

        // 8. Announcements
        console.log('8️⃣  Migrating Announcements...');
        const announcements = await supabase.announcement.findMany();
        console.log(`   Found ${announcements.length} announcements`);
        for (const announcement of announcements) {
            await neon.announcement.upsert({
                where: { id: announcement.id },
                create: announcement,
                update: announcement
            });
        }
        console.log('   ✅ Done\n');

        // 9. Badges
        console.log('9️⃣  Migrating Badges...');
        const badges = await supabase.badge.findMany();
        console.log(`   Found ${badges.length} badges`);
        for (const badge of badges) {
            await neon.badge.upsert({
                where: { id: badge.id },
                create: badge,
                update: badge
            });
        }
        console.log('   ✅ Done\n');

        // 10. Student Subjects (many-to-many)
        console.log('🔟 Migrating Student-Subject relationships...');
        try {
            const studentSubjects = await supabase.$queryRaw`SELECT * FROM "_StudentSubjects"`;
            console.log(`   Found ${studentSubjects.length} relationships`);
            for (const rel of studentSubjects) {
                await neon.$executeRaw`
          INSERT INTO "_StudentSubjects" ("A", "B") 
          VALUES (${rel.A}, ${rel.B}) 
          ON CONFLICT DO NOTHING
        `;
            }
            console.log('   ✅ Done\n');
        } catch (e) {
            console.log('   ⚠️  Skipped (may not exist)\n');
        }

        console.log('═══════════════════════════════════════');
        console.log('🎉 MIGRATION COMPLETE!');
        console.log('═══════════════════════════════════════');
        console.log(`✅ ${users.length} users`);
        console.log(`✅ ${students.length} students`);
        console.log(`✅ ${teams.length} teams`);
        console.log(`✅ ${subjects.length} subjects`);
        console.log(`✅ ${classes.length} classes`);
        console.log(`✅ ${materials.length} materials`);
        console.log(`✅ ${announcements.length} announcements`);
        console.log(`✅ ${badges.length} badges`);
        console.log('\n🚀 You can now login with your old credentials!');

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await supabase.$disconnect();
        await neon.$disconnect();
    }
}

migrate();
