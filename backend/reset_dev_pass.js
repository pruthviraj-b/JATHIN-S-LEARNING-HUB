const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPass() {
    const email = 'pruthviraj1984bc@gmail.com';
    const newPass = '123456';

    const hashedPassword = await bcrypt.hash(newPass, 10);

    const updated = await prisma.user.update({
        where: { email: email },
        data: { password: hashedPassword }
    });

    console.log(`✅ Password for ${email} reset to: ${newPass}`);
}

resetPass().finally(() => prisma.$disconnect());
