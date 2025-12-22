require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('👑 Verifying King of the Hill Logic...');

    // 1. Get all teams
    const teams = await prisma.team.findMany({
        include: { members: { select: { id: true, firstName: true } }, captain: true }
    });

    console.log(`Found ${teams.length} teams.`);

    // 2. Mock calculating scores
    const starCounts = await prisma.star.groupBy({
        by: ['studentId'],
        _sum: { points: true },
        where: { studentId: { not: null } }
    });

    const pointsMap = {};
    starCounts.forEach(s => pointsMap[s.studentId] = s._sum.points || 0);

    // 3. Simulate Logic
    for (const team of teams) {
        if (!team.members.length) {
            console.log(`Team ${team.name}: No members.`);
            continue;
        }

        let maxPoints = -9999;
        let bestCandidate = null;

        console.log(`\nChecking Team: ${team.name} (Current Captain: ${team.captain?.firstName || 'None'})`);

        for (const member of team.members) {
            const points = pointsMap[member.id] || 0;
            console.log(`   - ${member.firstName}: ${points} points`);

            if (points > maxPoints) {
                maxPoints = points;
                bestCandidate = member;
            }
        }

        if (bestCandidate) {
            const isNew = bestCandidate.id !== team.captainId;
            console.log(`   => Winner: ${bestCandidate.firstName} (${maxPoints} pts). Change needed? ${isNew ? 'YES' : 'NO'}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
