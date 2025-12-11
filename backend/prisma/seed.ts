import { PrismaClient } from '@prisma/client';
import { runAllSeeders } from './seeds';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('🚀 Prisma Seed Started');
  console.log('');

  await runAllSeeders(prisma);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
