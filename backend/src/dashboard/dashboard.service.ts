import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  DashboardSummaryDto,
  UserGreetingDto,
  FinancialSummaryDto,
  NextBillDto,
  ActivityItemDto,
  ChartDataPointDto,
  RecentTransactionDto,
} from './dto';

// Cache key prefix and TTL constants
const CHART_DATA_CACHE_KEY = 'dashboard:chart:';
const CHART_DATA_TTL = 600; // 10 minutes in seconds

// Approver role mappings to approval steps
const APPROVER_ROLE_STEP_MAP: Record<string, string[]> = {
  DIVISI_SIMPAN_PINJAM: ['DIVISI_SIMPAN_PINJAM'],
  KETUA: ['KETUA'],
  PENGAWAS: ['PENGAWAS'],
  SHOPKEEPER: ['SHOPKEEPER'],
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Main method to get complete dashboard summary
   * Executes independent queries in parallel for performance
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummaryDto> {
    // Get user with roles to determine if approver
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        roles: {
          include: {
            level: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract user roles
    const userRoles = user.roles.map((r) => r.level.levelName);
    const isApprover = this.checkIfApprover(userRoles);
    const approverSteps = this.getApproverSteps(userRoles);

    // Execute all independent queries in parallel for performance
    const [
      greeting,
      financialSummary,
      activities,
      chartData,
      recentTransactions,
    ] = await Promise.all([
      this.getUserGreeting(user),
      this.getFinancialSummary(userId),
      this.getActivityItems(userId, isApprover, approverSteps),
      this.getChartData(userId),
      this.getRecentTransactions(userId),
    ]);

    return {
      greeting,
      financialSummary,
      activities,
      chartData,
      recentTransactions,
      isApprover,
      approverRoles: userRoles.filter((role) =>
        Object.keys(APPROVER_ROLE_STEP_MAP).includes(role),
      ),
    };
  }

  /**
   * Get user greeting information
   */
  private async getUserGreeting(user: any): Promise<UserGreetingDto> {
    return {
      name: user.name,
      employeeNumber: user.employee?.employeeNumber || '',
      avatar: user.avatar,
    };
  }

  /**
   * Calculate financial summary for the 4 dashboard cards
   * Uses parallel queries for independent data sources
   */
  private async getFinancialSummary(userId: string): Promise<FinancialSummaryDto> {
    const [savingsAccount, activeDeposits, loanData, nextBill] = await Promise.all([
      // 1. Total Savings from SavingsAccount
      this.prisma.savingsAccount.findUnique({
        where: { userId },
        select: {
          saldoPokok: true,
          saldoWajib: true,
          saldoSukarela: true,
        },
      }),

      // 2. Active Deposits sum
      this.prisma.depositApplication.aggregate({
        where: {
          userId,
          status: 'ACTIVE',
        },
        _sum: {
          amountValue: true,
        },
      }),

      // 3. Remaining Loan calculation (Disbursed loans not completed)
      this.prisma.loanApplication.findMany({
        where: {
          userId,
          status: { in: ['DISBURSED'] },
        },
        include: {
          loanInstallments: {
            select: {
              isPaid: true,
              paidAmount: true,
              amount: true,
            },
          },
        },
      }),

      // 4. Next Bill (nearest unpaid installment)
      this.prisma.loanInstallment.findFirst({
        where: {
          loanApplication: { userId },
          isPaid: false,
        },
        orderBy: { dueDate: 'asc' },
        include: {
          loanApplication: {
            select: { loanNumber: true },
          },
        },
      }),
    ]);

    // Calculate total savings
    const totalSavings = savingsAccount
      ? new Prisma.Decimal(savingsAccount.saldoPokok)
          .add(savingsAccount.saldoWajib)
          .add(savingsAccount.saldoSukarela)
      : new Prisma.Decimal(0);

    // Calculate remaining loan
    let remainingLoan = new Prisma.Decimal(0);
    for (const loan of loanData) {
      const totalLoan = loan.totalRepayment || new Prisma.Decimal(0);
      const paidAmount = loan.loanInstallments.reduce((sum, inst) => {
        return inst.isPaid && inst.paidAmount
          ? sum.add(inst.paidAmount)
          : sum;
      }, new Prisma.Decimal(0));
      remainingLoan = remainingLoan.add(totalLoan.sub(paidAmount));
    }

    // Format next bill
    let nextBillDto: NextBillDto | null = null;
    if (nextBill) {
      const today = new Date();
      nextBillDto = {
        dueDate: nextBill.dueDate,
        amount: nextBill.amount.toString(),
        loanNumber: nextBill.loanApplication.loanNumber,
        daysUntilDue: differenceInDays(nextBill.dueDate, today),
      };
    }

    return {
      totalSavings: totalSavings.toString(),
      activeDeposits: (activeDeposits._sum.amountValue || new Prisma.Decimal(0)).toString(),
      remainingLoan: remainingLoan.toString(),
      nextBill: nextBillDto,
    };
  }

  /**
   * Get activity items based on user role
   * 
   * ROLE-BASED LOGIC:
   * - Regular Member: Returns their own applications that are pending (not COMPLETED/REJECTED)
   * - Approver Role: Returns OTHER users' applications waiting for their approval step
   * 
   * This creates a unified polymorphic list of activities from multiple sources:
   * - Loan Applications
   * - Deposit Applications  
   * - Savings Withdrawals
   * - Loan Repayments
   */
  private async getActivityItems(
    userId: string,
    isApprover: boolean,
    approverSteps: string[],
  ): Promise<ActivityItemDto[]> {
    const activities: ActivityItemDto[] = [];

    if (isApprover && approverSteps.length > 0) {
      // APPROVER VIEW: Get other users' applications pending their approval
      // This includes applications that are currently at their approval step
      
      const [loans, deposits, withdrawals, repayments] = await Promise.all([
        // Loans waiting for approver's step
        this.prisma.loanApplication.findMany({
          where: {
            userId: { not: userId }, // Other users' applications
            currentStep: { in: approverSteps as any },
            status: {
              in: ['UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'UNDER_REVIEW_PENGAWAS', 'APPROVED_PENDING_DISBURSEMENT', 'DISBURSEMENT_IN_PROGRESS', 'PENDING_AUTHORIZATION'],
            },
          },
          include: { user: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        }),

        // Deposits waiting for approver's step
        this.prisma.depositApplication.findMany({
          where: {
            userId: { not: userId },
            currentStep: { in: approverSteps as any },
            status: { in: ['UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA'] },
          },
          include: { user: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        }),

        // Withdrawals waiting for approver's step
        this.prisma.savingsWithdrawal.findMany({
          where: {
            userId: { not: userId },
            currentStep: { in: approverSteps as any },
            status: { in: ['UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED_WAITING_DISBURSEMENT', 'DISBURSEMENT_IN_PROGRESS'] },
          },
          include: { user: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        }),

        // Repayments waiting for approver's step
        this.prisma.loanRepayment.findMany({
          where: {
            userId: { not: userId },
            currentStep: { in: approverSteps as any },
            status: { in: ['UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA'] },
          },
          include: { user: { select: { name: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        }),
      ]);

      // Map loans to activity items
      for (const loan of loans) {
        activities.push({
          type: 'loan',
          id: loan.id,
          title: loan.loanNumber,
          status: loan.status,
          date: loan.submittedAt || loan.createdAt,
          amount: loan.loanAmount.toString(),
          applicantName: loan.user.name,
          currentStep: loan.currentStep || undefined,
        });
      }

      // Map deposits to activity items
      for (const deposit of deposits) {
        activities.push({
          type: 'deposit',
          id: deposit.id,
          title: deposit.depositNumber,
          status: deposit.status,
          date: deposit.submittedAt || deposit.createdAt,
          amount: deposit.amountValue.toString(),
          applicantName: deposit.user.name,
          currentStep: deposit.currentStep || undefined,
        });
      }

      // Map withdrawals to activity items
      for (const withdrawal of withdrawals) {
        activities.push({
          type: 'withdrawal',
          id: withdrawal.id,
          title: withdrawal.withdrawalNumber,
          status: withdrawal.status,
          date: withdrawal.submittedAt || withdrawal.createdAt,
          amount: withdrawal.netAmount.toString(),
          applicantName: withdrawal.user.name,
          currentStep: withdrawal.currentStep || undefined,
        });
      }

      // Map repayments to activity items
      for (const repayment of repayments) {
        activities.push({
          type: 'repayment',
          id: repayment.id,
          title: repayment.repaymentNumber,
          status: repayment.status,
          date: repayment.submittedAt || repayment.createdAt,
          amount: repayment.totalAmount.toString(),
          applicantName: repayment.user.name,
          currentStep: repayment.currentStep || undefined,
        });
      }
    } else {
      // MEMBER VIEW: Get their own pending applications
      // Shows applications that are not yet completed or rejected
      
      const [loans, deposits, withdrawals, repayments] = await Promise.all([
        // User's own pending loans
        this.prisma.loanApplication.findMany({
          where: {
            userId,
            status: {
              notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // User's own pending deposits
        this.prisma.depositApplication.findMany({
          where: {
            userId,
            status: {
              notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // User's own pending withdrawals
        this.prisma.savingsWithdrawal.findMany({
          where: {
            userId,
            status: {
              notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // User's own pending repayments
        this.prisma.loanRepayment.findMany({
          where: {
            userId,
            status: {
              notIn: ['COMPLETED', 'REJECTED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      // Map loans
      for (const loan of loans) {
        activities.push({
          type: 'loan',
          id: loan.id,
          title: loan.loanNumber,
          status: loan.status,
          date: loan.submittedAt || loan.createdAt,
          amount: loan.loanAmount.toString(),
          currentStep: loan.currentStep || undefined,
        });
      }

      // Map deposits
      for (const deposit of deposits) {
        activities.push({
          type: 'deposit',
          id: deposit.id,
          title: deposit.depositNumber,
          status: deposit.status,
          date: deposit.submittedAt || deposit.createdAt,
          amount: deposit.amountValue.toString(),
          currentStep: deposit.currentStep || undefined,
        });
      }

      // Map withdrawals
      for (const withdrawal of withdrawals) {
        activities.push({
          type: 'withdrawal',
          id: withdrawal.id,
          title: withdrawal.withdrawalNumber,
          status: withdrawal.status,
          date: withdrawal.submittedAt || withdrawal.createdAt,
          amount: withdrawal.netAmount.toString(),
          currentStep: withdrawal.currentStep || undefined,
        });
      }

      // Map repayments
      for (const repayment of repayments) {
        activities.push({
          type: 'repayment',
          id: repayment.id,
          title: repayment.repaymentNumber,
          status: repayment.status,
          date: repayment.submittedAt || repayment.createdAt,
          amount: repayment.totalAmount.toString(),
          currentStep: repayment.currentStep || undefined,
        });
      }
    }

    // Sort all activities by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return top 10 activities
    return activities.slice(0, 10);
  }

  /**
   * Get chart data for last 6 months
   * Implements Redis caching with 10 minute TTL
   * Aggregates SavingsTransactions by month showing Income vs Expense
   */
  private async getChartData(userId: string): Promise<ChartDataPointDto[]> {
    const cacheKey = `${CHART_DATA_CACHE_KEY}${userId}`;

    // Try to get from cache first
    const cachedData = await this.cacheManager.get<ChartDataPointDto[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Generate last 6 months date ranges
    const today = new Date();
    const chartData: ChartDataPointDto[] = [];

    // Get user's savings account ID
    const savingsAccount = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!savingsAccount) {
      // Return empty chart data for 6 months if no savings account
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        chartData.push({
          month: format(date, 'MMM yyyy', { locale: localeId }),
          income: '0',
          expense: '0',
        });
      }
      return chartData;
    }

    // Aggregate transactions for each month
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const transactions = await this.prisma.savingsTransaction.findMany({
        where: {
          savingsAccountId: savingsAccount.id,
          transactionDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          iuranPendaftaran: true,
          iuranBulanan: true,
          tabunganDeposito: true,
          shu: true,
          bunga: true,
          penarikan: true,
        },
      });

      let monthlyIncome = new Prisma.Decimal(0);
      let monthlyExpense = new Prisma.Decimal(0);

      for (const txn of transactions) {
        // Income = iuranPendaftaran + iuranBulanan + tabunganDeposito + shu + bunga
        monthlyIncome = monthlyIncome
          .add(txn.iuranPendaftaran)
          .add(txn.iuranBulanan)
          .add(txn.tabunganDeposito)
          .add(txn.shu)
          .add(txn.bunga);

        // Expense = penarikan
        monthlyExpense = monthlyExpense.add(txn.penarikan);
      }

      chartData.push({
        month: format(date, 'MMM yyyy', { locale: localeId }),
        income: monthlyIncome.toString(),
        expense: monthlyExpense.toString(),
      });
    }

    // Store in cache with TTL
    await this.cacheManager.set(cacheKey, chartData, CHART_DATA_TTL);

    return chartData;
  }

  /**
   * Get last 5 recent transactions
   */
  private async getRecentTransactions(userId: string): Promise<RecentTransactionDto[]> {
    // Get user's savings account ID
    const savingsAccount = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!savingsAccount) {
      return [];
    }

    const transactions = await this.prisma.savingsTransaction.findMany({
      where: {
        savingsAccountId: savingsAccount.id,
      },
      orderBy: { transactionDate: 'desc' },
      take: 5,
      include: {
        payrollPeriod: {
          select: {
            month: true,
            year: true,
          },
        },
      },
    });

    return transactions.map((txn) => ({
      id: txn.id,
      transactionDate: txn.transactionDate,
      note: txn.note,
      iuranPendaftaran: txn.iuranPendaftaran.toString(),
      iuranBulanan: txn.iuranBulanan.toString(),
      tabunganDeposito: txn.tabunganDeposito.toString(),
      shu: txn.shu.toString(),
      penarikan: txn.penarikan.toString(),
      bunga: txn.bunga.toString(),
      jumlahBunga: txn.jumlahBunga.toString(),
      periodMonth: txn.payrollPeriod?.month || null,
      periodYear: txn.payrollPeriod?.year || null,
    }));
  }

  /**
   * Check if user has any approver role
   */
  private checkIfApprover(roles: string[]): boolean {
    const approverRoles = Object.keys(APPROVER_ROLE_STEP_MAP);
    return roles.some((role) => approverRoles.includes(role));
  }

  /**
   * Get approval steps that user can handle based on their roles
   */
  private getApproverSteps(roles: string[]): string[] {
    const steps: string[] = [];
    for (const role of roles) {
      if (APPROVER_ROLE_STEP_MAP[role]) {
        steps.push(...APPROVER_ROLE_STEP_MAP[role]);
      }
    }
    return [...new Set(steps)]; // Remove duplicates
  }

  /**
   * Invalidate chart data cache for a user
   * Should be called when a new transaction is created
   */
  async invalidateChartCache(userId: string): Promise<void> {
    const cacheKey = `${CHART_DATA_CACHE_KEY}${userId}`;
    await this.cacheManager.del(cacheKey);
  }
}
