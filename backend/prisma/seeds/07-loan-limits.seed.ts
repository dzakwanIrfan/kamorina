import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Loan limits data based on golongan and years of service
 */
const LOAN_LIMITS_DATA = {
  I: [
    { min: 0, max: 1, amount: 0 },
    { min: 1, max: 2, amount: 4800000 },
    { min: 2, max: 3, amount: 8400000 },
    { min: 3, max: 6, amount: 12000000 },
    { min: 6, max: 9, amount: 18000000 },
    { min: 9, max: null, amount: 24000000 },
  ],
  II: [
    { min: 0, max: 1, amount: 0 },
    { min: 1, max: 2, amount: 4800000 },
    { min: 2, max: 3, amount: 8400000 },
    { min: 3, max: 6, amount: 12000000 },
    { min: 6, max: 9, amount: 18000000 },
    { min: 9, max: null, amount: 24000000 },
  ],
  III: [
    { min: 0, max: 1, amount: 0 },
    { min: 1, max: 2, amount: 7200000 },
    { min: 2, max: 3, amount: 10800000 },
    { min: 3, max: 6, amount: 14400000 },
    { min: 6, max: 9, amount: 24000000 },
    { min: 9, max: null, amount: 31200000 },
  ],
  IV: [
    { min: 0, max: 1, amount: 0 },
    { min: 1, max: 2, amount: 12000000 },
    { min: 2, max: 3, amount: 18000000 },
    { min: 3, max: 6, amount: 24000000 },
    { min: 6, max: 9, amount: 36000000 },
    { min: 9, max: null, amount: 42000000 },
  ],
};

/**
 * Seed Loan Limit Matrix
 */
export async function seedLoanLimits(ctx: SeederContext): Promise<void> {
  logInfo('LoanLimits', 'Seeding loan limit matrix...');

  const golongans = await ctx.prisma.golongan.findMany();

  if (golongans.length === 0) {
    console.warn('No golongan found. Skipping loan limits.');
    return;
  }

  let totalCreated = 0;

  for (const golongan of golongans) {
    const limitsForGolongan =
      LOAN_LIMITS_DATA[golongan.golonganName as keyof typeof LOAN_LIMITS_DATA];

    if (!limitsForGolongan) {
      console.log(`Skipping ${golongan.golonganName} (no predefined limits)`);
      continue;
    }

    // Delete existing limits for a clean slate
    await ctx.prisma.loanLimitMatrix.deleteMany({
      where: { golonganId: golongan.id },
    });

    // Create new limits
    for (const limit of limitsForGolongan) {
      await ctx.prisma.loanLimitMatrix.create({
        data: {
          golonganId: golongan.id,
          minYearsOfService: limit.min,
          maxYearsOfService: limit.max,
          maxLoanAmount: limit.amount,
        },
      });
      totalCreated++;
    }

    logSuccess(
      'LoanLimits',
      `Created ${limitsForGolongan.length} loan limits for Golongan ${golongan.golonganName}`,
    );
  }

  logSuccess('LoanLimits', `Total ${totalCreated} loan limit entries created`);
}
