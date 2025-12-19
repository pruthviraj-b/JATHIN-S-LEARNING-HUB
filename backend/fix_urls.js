const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching students...');
    const students = await prisma.student.findMany({
        where: {
            profileUrl: {
                startsWith: 'http://localhost'
            }
        }
    });

    console.log(`Found ${students.length} students with localhost URLs.`);

    for (const s of students) {
        if (!s.profileUrl) continue;

        // Remove http://localhost:4000 prefix
        // Handle various possibilities just in case
        let newUrl = s.profileUrl.replace('http://localhost:4000', '');

        // If it was just localhost:something else, strip it too if needed, but mainly 4000

        console.log(`Updating ${s.id}: ${s.profileUrl} -> ${newUrl}`);

        await prisma.student.update({
            where: { id: s.id },
            data: { profileUrl: newUrl }
        });
    }

    console.log('Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
