const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateTimetable() {
    console.log('🚀 Starting Timetable Generation for Next Week...');

    // 1. Clear existing future classes to avoid duplicates (Optional, but cleaner for dev)
    const now = new Date();
    await prisma.class.deleteMany({
        where: { scheduledAt: { gt: now } }
    });
    console.log('🧹 Cleared existing future classes.');

    // 2. Loop Classes 1 to 8
    for (let classLevel = 1; classLevel <= 8; classLevel++) {
        console.log(`\n📅 Scheduling Class ${classLevel}...`);

        // Get subjects for this class
        const subjects = await prisma.subject.findMany({
            where: { classLevel: classLevel }
        });

        if (subjects.length === 0) {
            console.log(`⚠️ No subjects found for Class ${classLevel}. Skipping.`);
            continue;
        }

        // 3. Schedule for next 7 days
        for (let day = 0; day < 7; day++) {
            const date = new Date();
            date.setDate(date.getDate() + day);

            // Skip Sundays (0)
            if (date.getDay() === 0) continue;

            // 4 Create 4 slots per day (10am, 11am, 2pm, 3pm)
            const timeSlots = [10, 11, 14, 15]; // Hours

            for (let i = 0; i < timeSlots.length; i++) {
                const hour = timeSlots[i];

                // Round robin select subject
                const subject = subjects[(day + i) % subjects.length];

                const scheduleDate = new Date(date);
                scheduleDate.setHours(hour, 0, 0, 0);

                await prisma.class.create({
                    data: {
                        subjectId: subject.id,
                        title: `Lecture ${day + 1}`, // Generic title
                        scheduledAt: scheduleDate,
                        meetingLink: 'https://meet.google.com/abc-defg-hij' // Placeholder
                    }
                });
            }
        }
        console.log(`✅ Class ${classLevel} scheduled.`);
    }

    console.log('\n✨ Timetable Generation Complete!');
}

generateTimetable()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
