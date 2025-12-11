import { Prisma } from '@prisma/client';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

/**
 * Seed Savings Accounts for all users
 * 
 * Creates savings accounts with ZERO balances.
 * The balances will be populated by the transaction history seeder (11-savings-transactions.seed.ts).
 * This ensures 100% consistency between transaction history and current balance.
 */
export async function seedSavingsAccounts(ctx: SeederContext): Promise<void> {
    logInfo('SavingsAccounts', 'Seeding savings accounts (initialization)...');

    const allUsers = await ctx.prisma.user.findMany({
        include: {
            savingsAccount: true,
        },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
        // Skip if already has savings account
        if (user.savingsAccount) {
            skippedCount++;
            continue;
        }

        // Initialize with zero balances
        // Real balances will be calculated from transaction history
        await ctx.prisma.savingsAccount.create({
            data: {
                userId: user.id,
                saldoPokok: 0,
                saldoWajib: 0,
                saldoSukarela: 0,
                bungaDeposito: 0,
            },
        });

        createdCount++;
    }

    logSuccess('SavingsAccounts', `Initialized ${createdCount} savings accounts with 0 balance (${skippedCount} skipped)`);
    logInfo('SavingsAccounts', 'ℹ️ Balances will be updated by transaction seeder');
}
