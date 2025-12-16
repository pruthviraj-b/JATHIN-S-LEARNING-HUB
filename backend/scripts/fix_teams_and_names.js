const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Fix Name: Harshith -> Harshitha
    const harshith = await prisma.student.findFirst({
        where: { firstName: 'Harshith' }
    });

    if (harshith) {
        console.log(`Found 'Harshith', renaming to 'Harshitha'...`);
        await prisma.student.update({
            where: { id: harshith.id },
            data: { firstName: 'Harshitha' }
        });
        console.log('✅ Renamed successfully.');
    } else {
        console.log("'Harshith' not found (maybe already renamed or does not exist).");
    }

    const harshitha = await prisma.student.findFirst({ where: { firstName: 'Harshitha' } });
    if (!harshitha) {
        console.log("⚠️ Warning: 'Harshitha' does not exist in DB.");
    }

    // 2. Enforce Teams
    const teamsList = [
        { name: 'Team 1', members: ['Poorvika', 'Trishika Aadhya'] },
        { name: 'Team 2', members: ['Suraksha', 'Reethana'] },
        { name: 'Team 3', members: ['Harshini', 'Shamika'] },
        { name: 'Team 4', members: ['Dhayantha', 'Vedha'] },
        { name: 'Team 5', members: ['Varun', 'Charan', 'Lekhan'] },
        { name: 'Team 6', members: ['Harshitha', 'Lahari'] }
    ];

    for (const t of teamsList) {
        const team = await prisma.team.findFirst({ where: { name: t.name } });
        if (!team) {
            console.log(`Creating ${t.name}...`);
            await prisma.team.create({ data: { name: t.name } });
        } else {
            // Assign members
            for (const m of t.members) {
                // Fuzzy match for names like "Trishika Aadhya"
                const student = await prisma.student.findFirst({
                    where: {
                        OR: [
                            { firstName: m },
                            { firstName: { startsWith: m.split(' ')[0] } }
                        ]
                    }
                });
                if (student) {
                    if (student.teamId !== team.id) {
                        console.log(`Assigning ${student.firstName} to ${t.name}...`);
                        await prisma.student.update({
                            where: { id: student.id },
                            data: { teamId: team.id }
                        });
                    }
                } else {
                    console.log(`❌ Member not found: ${m}`);
                }
            }
        }
    }
    console.log("Team verification complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
