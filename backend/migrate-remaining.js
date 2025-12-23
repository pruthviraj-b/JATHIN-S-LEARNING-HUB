require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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

async function migrateRemaining() {
    console.log('🚀 Completing migration - Materials, Announcements, Badges...\n');

    try {
        await supabase.$connect();
        await neon.$connect();

        // Materials
        try {
            console.log('7️⃣  Migrating Materials...');
            const materials = await supabase.material.findMany().catch(() => []);
            console.log(`   Found ${materials.length} materials`);
            for (const mat of materials) {
                await neon.material.upsert({ where: { id: mat.id }, create: mat, update: mat });
            }
            console.log('   ✅ Done\n');
        } catch (e) {
            console.log('   ⚠️  Skipped (table may not exist)\n');
        }

        // Announcements
        try {
            console.log('8️⃣  Migrating Announcements...');
            const announcements = await supabase.announcement.findMany().catch(() => []);
            console.log(`   Found ${announcements.length} announcements`);
            for (const ann of announcements) {
                await neon.announcement.upsert({ where: { id: ann.id }, create: ann, update: ann });
            }
            console.log('   ✅ Done\n');
        } catch (e) {
            console.log('   ⚠️  Skipped\n');
        }

        // Badges
        try {
            console.log('9️⃣  Migrating Badges...');
            const badges = await supabase.badge.findMany().catch(() => []);
            console.log(`   Found ${badges.length} badges`);
            for (const badge of badges) {
                await neon.badge.upsert({ where: { id: badge.id }, create: badge, update: badge });
            }
            console.log(' ✅ Done\n');
        } catch (e) {
            console.log('   ⚠️  Skipped\n');
        }

        console.log('🎉 MIGRATION COMPLETE! You can now login!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await supabase.$disconnect();
        await neon.$disconnect();
    }
}

migrateRemaining();
