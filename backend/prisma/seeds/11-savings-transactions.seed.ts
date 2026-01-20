import { Prisma } from '@prisma/client';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

// Settings (should match cooperative settings)
const MONTHLY_FEE = 50000;
const INITIAL_FEE = 500000;
const INTEREST_RATE = 4; // 4% per year

/**
 * Get past months for payroll periods
 * @param count Number of months to go back
 * @returns Array of {month, year} objects
 */
function getPastMonths(
  count: number,
): Array<{ month: number; year: number; name: string; date: Date }> {
  const now = new Date();
  const months: Array<{
    month: number;
    year: number;
    name: string;
    date: Date;
  }> = [];

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  for (let i = count; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 27); // Payday usually 27th
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      name: `Periode ${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      date: date,
    });
  }

  return months;
}

/**
 * Seed Savings Transactions and Payroll Periods
 */
export async function seedSavingsTransactions(
  ctx: SeederContext,
): Promise<void> {
  logInfo('SavingsTransactions', 'Seeding payroll periods and transactions...');

  // Get verify members with savings accounts and applications
  const verifiedUsers = await ctx.prisma.user.findMany({
    where: {
      memberVerified: true,
      savingsAccount: { isNot: null },
    },
    include: {
      savingsAccount: true,
      memberApplications: true,
      employee: true,
    },
  });

  if (verifiedUsers.length === 0) {
    console.warn('No verified users with savings accounts found.');
    return;
  }

  logInfo(
    'SavingsTransactions',
    `Found ${verifiedUsers.length} verified members`,
  );

  // Create payroll periods for past 12 months
  const pastMonths = getPastMonths(12);

  for (const period of pastMonths) {
    // Check if period exists
    let payrollPeriod = await ctx.prisma.payrollPeriod.findUnique({
      where: { month_year: { month: period.month, year: period.year } },
    });

    if (!payrollPeriod) {
      payrollPeriod = await ctx.prisma.payrollPeriod.create({
        data: {
          month: period.month,
          year: period.year,
          name: period.name,
          isProcessed: true,
          processedAt: period.date,
          totalAmount: 0, // Will be updated
        },
      });
    }

    // Store in context for reference
    ctx.payrollPeriods.push({
      id: payrollPeriod.id,
      month: period.month,
      year: period.year,
    });
  }

  logSuccess(
    'SavingsTransactions',
    `Ensured ${ctx.payrollPeriods.length} payroll periods exist`,
  );

  // Local state to track running balances per user
  // This avoids DB roundtrips for every calculation
  const userBalances: Record<
    string,
    {
      saldoPokok: Prisma.Decimal;
      saldoWajib: Prisma.Decimal;
      saldoSukarela: Prisma.Decimal;
      bungaDeposito: Prisma.Decimal;
    }
  > = {};

  // Initialize tracking
  for (const user of verifiedUsers) {
    userBalances[user.id] = {
      saldoPokok: new Prisma.Decimal(0),
      saldoWajib: new Prisma.Decimal(0),
      saldoSukarela: new Prisma.Decimal(0),
      bungaDeposito: new Prisma.Decimal(0),
    };
  }

  let totalTransactions = 0;
  const periodTotals: Record<string, Prisma.Decimal> = {};

  // Process timeline chronologicaly
  for (let i = 0; i < ctx.payrollPeriods.length; i++) {
    const period = ctx.payrollPeriods[i];
    const periodDate = pastMonths[i].date;

    periodTotals[period.id] = new Prisma.Decimal(0);

    for (const user of verifiedUsers) {
      if (!user.savingsAccount) continue;

      const memberApp = user.memberApplications[0];
      const balances = userBalances[user.id];

      // Determine if user was member at this point
      const joinDate = user.employee?.permanentEmployeeDate || user.createdAt;
      // Also consider member application approval date if available
      const approvalDate = memberApp?.approvedAt || joinDate;
      const isMember = approvalDate <= periodDate;

      if (!isMember) continue;

      // 1. Iuran Bulanan (Mandatory Savings)
      const iuranBulanan = new Prisma.Decimal(MONTHLY_FEE);
      balances.saldoWajib = balances.saldoWajib.add(iuranBulanan);

      // 2. Iuran Pendaftaran (Entrance Fee/Simpanan Pokok) - if not fully paid
      let iuranPendaftaran = new Prisma.Decimal(0);
      const targetEntranceFee = new Prisma.Decimal(
        memberApp?.entranceFee || INITIAL_FEE,
      );

      if (balances.saldoPokok.lt(targetEntranceFee)) {
        // If installment plan 1 (Cash), pay full in first valid month
        // If installment plan 2 (2x), pay half
        const installmentPlan = memberApp?.installmentPlan || 1;

        if (installmentPlan === 1) {
          // Pay remaining
          iuranPendaftaran = targetEntranceFee.sub(balances.saldoPokok);
        } else {
          // Pay 50%
          const halfFee = targetEntranceFee.div(2);
          const remaining = targetEntranceFee.sub(balances.saldoPokok);
          // Can't pay more than remaining
          iuranPendaftaran = remaining.lt(halfFee) ? remaining : halfFee;
        }

        balances.saldoPokok = balances.saldoPokok.add(iuranPendaftaran);
      }

      // 3. Tabungan Deposito (Voluntary Savings)
      // Randomly add some savings for some users
      // Admin users save more often
      let tabunganDeposito = new Prisma.Decimal(0);

      // Admin-ish users
      const isAdmin =
        user.email.includes('admin') ||
        user.email.includes('divisi') ||
        user.email.includes('pengawas') ||
        user.email.includes('payroll') ||
        user.email.includes('shopkeeper');

      // Chance of saving: 80% for admins, 30% for others
      const shouldSave = Math.random() < (isAdmin ? 0.8 : 0.3);

      if (shouldSave) {
        const amounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];
        // Admins save bigger amounts
        const amountIndex = Math.floor(Math.random() * (isAdmin ? 6 : 3));
        tabunganDeposito = new Prisma.Decimal(amounts[amountIndex]);

        balances.saldoSukarela = balances.saldoSukarela.add(tabunganDeposito);
      }

      // 4. Bunga (Interest)
      // Calculate interest based on *previous* month's total balance
      // (Simplified: using current running balance before this month's additions would be more accurate but this is fine for seed)
      const totalBalanceForInterest = balances.saldoPokok
        .add(balances.saldoWajib)
        .add(balances.saldoSukarela)
        .sub(iuranBulanan) // subtract current month additions to base calculation on opening balance
        .sub(iuranPendaftaran)
        .sub(tabunganDeposito);

      let bunga = new Prisma.Decimal(0);
      if (totalBalanceForInterest.gt(0)) {
        const monthlyInterestRate = new Prisma.Decimal(INTEREST_RATE)
          .div(100)
          .div(12);
        bunga = totalBalanceForInterest.mul(monthlyInterestRate);
        balances.bungaDeposito = balances.bungaDeposito.add(bunga);
      }

      // Create Transaction Record
      // Check if exists first to avoid dupes on re-seed
      const txId = `${user.savingsAccount.id}_${period.id}`; // deterministic check
      const existing = await ctx.prisma.savingsTransaction.findUnique({
        where: {
          savingsAccountId_payrollPeriodId: {
            savingsAccountId: user.savingsAccount.id,
            payrollPeriodId: period.id,
          },
        },
      });

      if (!existing) {
        await ctx.prisma.savingsTransaction.create({
          data: {
            savingsAccountId: user.savingsAccount.id,
            payrollPeriodId: period.id,
            interestRate: INTEREST_RATE,
            iuranPendaftaran,
            iuranBulanan,
            tabunganDeposito,
            shu: 0,
            penarikan: 0,
            bunga,
            jumlahBunga: balances.bungaDeposito, // Cumulative interest so far
            transactionDate: periodDate,
          },
        });
        totalTransactions++;
      }

      const totalTransactionAmount = iuranPendaftaran
        .add(iuranBulanan)
        .add(tabunganDeposito);
      periodTotals[period.id] = periodTotals[period.id].add(
        totalTransactionAmount,
      );
    }

    // Update period total amount
    await ctx.prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { totalAmount: periodTotals[period.id] },
    });
  }

  logSuccess(
    'SavingsTransactions',
    `Created ${totalTransactions} savings transactions`,
  );

  // FINAL SYNCHRONIZATION
  logInfo('SavingsTransactions', 'Synchronizing final balances...');

  let synchronizedCount = 0;

  for (const user of verifiedUsers) {
    const balances = userBalances[user.id];

    // 1. Update Savings Account
    await ctx.prisma.savingsAccount.update({
      where: { id: user.savingsAccount!.id },
      data: {
        saldoPokok: balances.saldoPokok,
        saldoWajib: balances.saldoWajib,
        saldoSukarela: balances.saldoSukarela,
        bungaDeposito: balances.bungaDeposito,
      },
    });

    // 2. Update Member Application (if exists)
    const memberApp = user.memberApplications[0];
    if (memberApp) {
      const entranceFee = memberApp.entranceFee;
      const paidAmount = balances.saldoPokok;
      const remaining = entranceFee.sub(paidAmount);
      const isPaidOff = remaining.lte(0);

      // Prevent remaining < 0
      const finalRemaining = remaining.lt(0)
        ? new Prisma.Decimal(0)
        : remaining;

      await ctx.prisma.memberApplication.update({
        where: { id: memberApp.id },
        data: {
          paidAmount: paidAmount.gt(entranceFee) ? entranceFee : paidAmount, // Cap at entrance fee
          remainingAmount: finalRemaining,
          isPaidOff: isPaidOff,
        },
      });
    }

    synchronizedCount++;
  }

  logSuccess(
    'SavingsTransactions',
    `Synchronized balances for ${synchronizedCount} users`,
  );
}
