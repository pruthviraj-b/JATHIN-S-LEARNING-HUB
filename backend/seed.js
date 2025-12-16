const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@tuition.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('✅ Admin user already exists:', email);
    return;
  }

  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email,
      password,
      role: 'ADMIN'
    }
  });
  console.log('✅ Created Admin user: admin@tuition.com / admin123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
