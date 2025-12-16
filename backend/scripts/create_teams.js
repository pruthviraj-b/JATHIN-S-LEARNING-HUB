const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const teamsData = [
    { name: 'Team 1', members: ['Poorvika', 'Trishika Aadhya'] },
    { name: 'Team 2', members: ['Suraksha', 'Reethana'] },
    { name: 'Team 3', members: ['Harshini', 'Shamika'] },
    { name: 'Team 4', members: ['Dhayantha', 'Vedha'] },
    { name: 'Team 5', members: ['Varun', 'Charan', 'Lekhan'] },
    { name: 'Team 6', members: ['Harshith', 'Lahari'] },
];

async function main() {
    console.log('🧹 Clearing existing teams...');
    // Optional: if you want to clear old teams
    // await prisma.student.updateMany({ data: { teamId: null } });
    // await prisma.team.deleteMany({});

    for (const t of teamsData) {
        console.log(`Creating ${t.name}...`);

        // Create or find team
        let team = await prisma.team.findFirst({ where: { name: t.name } });
        if (!team) {
            team = await prisma.team.create({
                data: { name: t.name }
            });
        }

        for (const memberName of t.members) {
            // Find student by first name or partial match
            // We use the exact names found in the previous step
            const student = await prisma.student.findFirst({
                where: {
                    OR: [
                        { firstName: memberName },
                        { firstName: { contains: memberName.split(' ')[0] } } // Handle "Trishika Aadhya" vs "Aadhya"
                    ]
                }
            });

            if (student) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { teamId: team.id }
                });
                console.log(`  ✅ Assigned ${student.firstName} to ${t.name}`);
            } else {
                console.error(`  ❌ Student NOT FOUND: ${memberName}`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
