const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjectsByClass = {
    1: ["English Lang", "English Lit", "Maths", "EVS", "Hindi", "Computer/AI", "Kannada"],
    2: ["Maths", "Kannada", "EVS", "English Lang", "English Lit", "Hindi", "Computer/AI"],
    3: ["English Lit", "Social Studies", "English Lang", "Kannada", "Maths", "Computer/AI", "Hindi", "Science"],
    4: ["English Lang", "English Lit", "Maths", "Hindi", "Social Studies", "Kannada", "Computer/AI", "Science"],
    5: ["Maths", "Kannada", "Social Studies", "Hindi", "English Lang", "Computer/AI", "Science", "English Lit"],
    6: ["English Lang", "Biology", "Chemistry", "Mathematics", "His & Civ", "Geography", "Kannada", "Physics", "Computer/AI", "Hindi", "English Lit"],
    7: ["English Lang", "Chemistry", "Biology", "Computer/AI", "Geography", "Mathematics", "English Lit", "Hindi", "Physics", "Kannada", "His & Civ"],
    8: ["His & Civ", "Computer/AI", "English Lit", "Chemistry", "Mathematics", "Kannada", "Physics", "English Lang", "Geography", "Biology"]
};

// Assuming Class 9 follows a similar pattern to 8 for now, or we skip it. User didn't provide Class 9 in chart.
// I will skip Class 9 and warn the user.

async function main() {
    console.log("Start importing subjects...");

    for (const [classLevelStr, subjects] of Object.entries(subjectsByClass)) {
        const classLevel = parseInt(classLevelStr);
        console.log(`\nProcessing Class ${classLevel}...`);

        for (const name of subjects) {
            // Check if exists
            const existing = await prisma.subject.findFirst({
                where: {
                    name: name,
                    classLevel: classLevel
                }
            });

            if (existing) {
                console.log(`  - ${name} (Class ${classLevel}) already exists.`);
            } else {
                try {
                    await prisma.subject.create({
                        data: {
                            name,
                            classLevel,
                            visible: true
                        }
                    });
                    console.log(`  ✅ Created ${name}`);
                } catch (e) {
                    console.error(`  ❌ Error creating ${name}:`, e.message);
                }
            }
        }
    }
    console.log("\nSubject import finished.");
    prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
    prisma.$disconnect();
});
