import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Deposit amount options
 */
const DEPOSIT_AMOUNTS = [
    { code: 'AMOUNT_200K', label: 'Rp 200.000', amount: 200000, sortOrder: 1 },
    { code: 'AMOUNT_500K', label: 'Rp 500.000', amount: 500000, sortOrder: 2 },
    { code: 'AMOUNT_1000K', label: 'Rp 1.000.000', amount: 1000000, sortOrder: 3 },
    { code: 'AMOUNT_1500K', label: 'Rp 1.500.000', amount: 1500000, sortOrder: 4 },
    { code: 'AMOUNT_2000K', label: 'Rp 2.000.000', amount: 2000000, sortOrder: 5 },
    { code: 'AMOUNT_3000K', label: 'Rp 3.000.000', amount: 3000000, sortOrder: 6 },
];

/**
 * Deposit tenor options
 */
const DEPOSIT_TENORS = [
    { code: 'TENOR_3', label: '3 Bulan', months: 3, sortOrder: 1 },
    { code: 'TENOR_6', label: '6 Bulan', months: 6, sortOrder: 2 },
    { code: 'TENOR_9', label: '9 Bulan', months: 9, sortOrder: 3 },
    { code: 'TENOR_12', label: '12 Bulan', months: 12, sortOrder: 4 },
];

/**
 * Seed Deposit Options (Amount and Tenor)
 */
export async function seedDepositOptions(ctx: SeederContext): Promise<void> {
    logInfo('DepositOptions', 'Seeding deposit options...');

    // Seed amount options
    for (const item of DEPOSIT_AMOUNTS) {
        await ctx.prisma.depositAmountOption.upsert({
            where: { code: item.code },
            update: {},
            create: item,
        });
    }

    logSuccess('DepositOptions', `Created ${DEPOSIT_AMOUNTS.length} deposit amount options`);

    // Seed tenor options
    for (const item of DEPOSIT_TENORS) {
        await ctx.prisma.depositTenorOption.upsert({
            where: { code: item.code },
            update: {},
            create: item,
        });
    }

    logSuccess('DepositOptions', `Created ${DEPOSIT_TENORS.length} deposit tenor options`);
}
