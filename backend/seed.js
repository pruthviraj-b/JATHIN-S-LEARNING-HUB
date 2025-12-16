const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'thepruthviraj1984bc@gmail.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('✅ Admin user already exists:', email);
    return;
  }

  const password = await bcrypt.hash('Iamrajx1984bc$', 10);
  await prisma.user.create({
    data: {
      email,
      password,
      role: 'ADMIN'
    }
  });
  console.log(`✅ Created Admin user: ${email} / Iamrajx1984bc$`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
