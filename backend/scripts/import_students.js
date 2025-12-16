const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const students = [
    { name: "Poorvika", classLevel: 1 },
    { name: "Varshith", classLevel: 2 },
    { name: "Trishika Aadhya", classLevel: 2 },
    { name: "Harshith", classLevel: 5 },
    { name: "Lahari", classLevel: 5 },
    { name: "Suraksha", classLevel: 5 },
    { name: "Reethana", classLevel: 7 },
    { name: "Harshini", classLevel: 7 },
    { name: "Shamika", classLevel: 7 },
    { name: "Dhayantha", classLevel: 7 },
    { name: "Lekhan", classLevel: 6 }
];

async function main() {
    console.log(`Start importing ${students.length} students...`);

    for (const s of students) {
        // Prepare data
        const firstName = s.name.split(' ')[0];
        const lastName = s.name.split(' ').slice(1).join(' ') || '';
        const emailName = s.name.toLowerCase().replace(/\s+/g, '');
        const email = `${emailName}@jlh.com`;
        const passwordPlain = firstName.toLowerCase(); // "password keep names there only" - usually first name is safer/simpler or full name. I will use first name lower case to be consistent with email logic partially. actually user same 'names'.
        // Let's use the full name lowercased without spaces as password to match email prefix just to be safe, or just first name. 
        // User said "passward keep names there only". 
        // I will use proper casing name as password? Or lowercase? Usually lowercase is standard for default passwords.
        // Let's use `emailName` (lowercase, no spaces) as password.
        const password = await bcrypt.hash(emailName, 10);

        console.log(`Processing: ${s.name} (Class ${s.classLevel}) -> ${email}`);

        // Check if exists
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            console.log(`Skipping ${email} - already exists`);
            continue;
        }

        // Create
        try {
            await prisma.user.create({
                data: {
                    email,
                    password,
                    role: 'STUDENT',
                    student: {
                        create: {
                            firstName: firstName,
                            lastName: lastName,
                            classLevel: s.classLevel,
                            active: true
                        }
                    }
                }
            });
            console.log(`✅ Created ${s.name}`);
        } catch (e) {
            console.error(`❌ Failed to create ${s.name}: ${e.message}`);
        }
    }
    console.log("Import finished.");
    prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
    prisma.$disconnect();
});
