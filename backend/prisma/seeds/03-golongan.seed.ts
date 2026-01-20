import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Seed Golongan (Employee Grades)
 */
export async function seedGolongan(ctx: SeederContext): Promise<void> {
  logInfo('Golongan', 'Seeding golongan...');

  const golongans = [
    { golonganName: 'I', description: 'Golongan I' },
    { golonganName: 'II', description: 'Golongan II' },
    { golonganName: 'III', description: 'Golongan III' },
    { golonganName: 'IV', description: 'Golongan IV' },
  ];

  for (const gol of golongans) {
    await ctx.prisma.golongan.upsert({
      where: { golonganName: gol.golonganName },
      update: {},
      create: gol,
    });
  }

  // Store references in context
  const allGolongan = await ctx.prisma.golongan.findMany();
  ctx.golongan.golongan1 = allGolongan.find((g) => g.golonganName === 'I');
  ctx.golongan.golongan2 = allGolongan.find((g) => g.golonganName === 'II');
  ctx.golongan.golongan3 = allGolongan.find((g) => g.golonganName === 'III');
  ctx.golongan.golongan4 = allGolongan.find((g) => g.golonganName === 'IV');

  logSuccess('Golongan', `Created ${golongans.length} golongan`);
}
