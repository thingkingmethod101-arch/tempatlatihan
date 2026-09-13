import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const kontak = 'admin@test.com';
  const password = 'password123';

  const existing = await prisma.user.findUnique({ where: { kontak } });
  if (existing) {
    console.log('Akun admin sudah ada, tidak dibuat ulang.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      nama: 'Admin Amarkya',
      role: Role.admin,
      kontak,
      isActive: true,
      authCredential: {
        create: { passwordHash, provider: 'password' },
      },
    },
  });

  console.log('Akun admin berhasil dibuat:');
  console.log('Kontak  :', kontak);
  console.log('Password:', password);
  console.log('User ID :', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });