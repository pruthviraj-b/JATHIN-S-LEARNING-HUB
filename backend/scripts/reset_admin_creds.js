const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const newEmail = 'thepruthviraj1984bc@gmail.com';
    const newPass = 'Iamrajx1984bc$';
    const hashed = await bcrypt.hash(newPass, 10);

    const oldEmail = 'admin@tuition.com';

    // Check if old admin exists
    const oldAdmin = await prisma.user.findUnique({ where: { email: oldEmail } });

    if (oldAdmin) {
        console.log('Found old admin, updating...');
        await prisma.user.update({
            where: { email: oldEmail },
            data: {
                email: newEmail,
                password: hashed
            }
        });
        console.log('✅ Updated old admin to new credentials.');
    } else {
        // Check if new admin already exists
        const newAdmin = await prisma.user.findUnique({ where: { email: newEmail } });
        if (newAdmin) {
            console.log('New admin email already exists, updating password...');
            await prisma.user.update({
                where: { email: newEmail },
                data: { password: hashed }
            });
            console.log('✅ Updated password for existing admin.');
        } else {
            console.log('Creating new admin...');
            await prisma.user.create({
                data: {
                    email: newEmail,
                    password: hashed,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Created new admin.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
