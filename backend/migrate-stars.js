require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const supabase = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres.xizctbzoqmnmfkhfehbg:80NCVZWHS2VyoctO@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
        }
    }
});

const neon = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_zIcLvejWH07i@ep-calm-river-a1it0690-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
        }
    }
});

async function migrateStars() {
    console.log('⭐ Migrating Stars...\n');

    try {
        await supabase.$connect();
        await neon.$connect();

        const stars = await supabase.star.findMany();
        console.log(`Found ${stars.length} stars to migrate`);

        for (const star of stars) {
            console.log(`  → ${star.reason} (${star.points} points) for student ${star.studentId}`);
            await neon.star.upsert({
                where: { id: star.id },
                create: star,
                update: star
            });
        }

        console.log(`\n✅ Migrated ${stars.length} stars!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await supabase.$disconnect();
        await neon.$disconnect();
    }
}

migrateStars();
