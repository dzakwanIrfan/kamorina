import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, SettingCategory } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  PayrollSettings,
  PayrollSummary,
  ProcessorResult,
} from './interfaces/payroll.interface';
import {
  PAYROLL_SETTINGS_KEYS,
  DEFAULT_VALUES,
} from './constants/payroll.constants';
import { MembershipFeeProcessor } from './services/membership-fee.processor';
import { MandatorySavingsProcessor } from './services/mandatory-savings.processor';
import { DepositSavingsProcessor } from './services/deposit-savings.processor';
import { LoanInstallmentProcessor } from './services/loan-installment.processor';
import { InterestCalculatorProcessor } from './services/interest-calculator.processor';
import { ManualPayrollDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private prisma: PrismaService,
    private membershipFeeProcessor: MembershipFeeProcessor,
    private mandatorySavingsProcessor: MandatorySavingsProcessor,
    private depositSavingsProcessor: DepositSavingsProcessor,
    private loanInstallmentProcessor: LoanInstallmentProcessor,
    private interestCalculatorProcessor: InterestCalculatorProcessor,
  ) {}

  /**
   * Cron job berjalan setiap hari jam 00:01
   * Akan cek apakah hari ini tanggal gajian
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleScheduledPayroll(): Promise<void> {
    this.logger.log('=== Scheduled Payroll Check Started ===');

    try {
      const settings = await this.getPayrollSettings();
      const today = dayjs();

      // Cek apakah hari ini tanggal gajian
      if (today.date() !== settings.payrollDate) {
        this.logger.log(
          `Today is ${today.date()}, payroll date is ${settings.payrollDate}.  Skipping. `,
        );
        return;
      }

      await this.processPayroll(today.month() + 1, today.year());
    } catch (error) {
      this.logger.error('Scheduled payroll failed', error.stack);
      throw error;
    }
  }

  /**
   * Manual trigger untuk payroll (untuk admin/testing)
   */
  async triggerManualPayroll(dto: ManualPayrollDto): Promise<PayrollSummary> {
    const today = dayjs();
    const month = dto.month || today.month() + 1;
    const year = dto.year || today.year();

    this.logger.log(`=== Manual Payroll Triggered for ${month}/${year} ===`);

    // Cek apakah sudah diproses
    const existingPeriod = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month, year } },
    });

    if (existingPeriod?.isProcessed && !dto.force) {
      throw new Error(
        `Payroll for ${month}/${year} already processed.  Use force=true to reprocess.`,
      );
    }

    return this.processPayroll(month, year, dto.force);
  }

  /**
   * Main payroll processing logic
   */
  async processPayroll(
    month: number,
    year: number,
    force = false,
  ): Promise<PayrollSummary> {
    this.logger.log(`Processing payroll for ${month}/${year}...`);

    const settings = await this.getPayrollSettings();
    const processDate = dayjs()
      .set('month', month - 1)
      .set('year', year);

    // Setup cutoff dates
    const cutoffEnd = processDate
      .set('date', settings.cutoffDate)
      .startOf('day');
    const cutoffStart = cutoffEnd
      .subtract(1, 'month')
      .add(1, 'day')
      .startOf('day');

    // Create or get payroll period
    let payrollPeriod = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month, year } },
    });

    if (payrollPeriod?.isProcessed && !force) {
      throw new Error(`Payroll period ${month}/${year} already processed`);
    }

    if (!payrollPeriod) {
      payrollPeriod = await this.prisma.payrollPeriod.create({
        data: {
          month,
          year,
          name: `Periode ${processDate.format('MMMM YYYY')}`,
          isProcessed: false,
        },
      });
    } else if (force) {
      // Reset if force reprocess
      await this.prisma.payrollPeriod.update({
        where: { id: payrollPeriod.id },
        data: { isProcessed: false, processedAt: null, totalAmount: 0 },
      });
    }

    const context: PayrollContext = {
      settings,
      payrollPeriodId: payrollPeriod.id,
      cutoffStart,
      cutoffEnd,
      processDate,
    };

    this.logger.log(
      `Cutoff period: ${cutoffStart.format('DD/MM/YYYY')} - ${cutoffEnd.format('DD/MM/YYYY')}`,
    );

    // Initialize results
    let membershipResult: ProcessorResult = this.emptyResult();
    let mandatorySavingsResult: ProcessorResult = this.emptyResult();
    let depositSavingsResult: ProcessorResult = this.emptyResult();
    let loanInstallmentResult: ProcessorResult = this.emptyResult();
    let interestResult: ProcessorResult = this.emptyResult();

    // Process dalam transaction
    await this.prisma.$transaction(
      async (tx) => {
        // 1. Process membership fees (Simpanan Pokok)
        membershipResult = await this.membershipFeeProcessor.process(
          tx,
          context,
        );

        // 2. Process mandatory savings (Simpanan Wajib)
        mandatorySavingsResult = await this.mandatorySavingsProcessor.process(
          tx,
          context,
        );

        // 3. Process deposit savings (Tabungan Deposito)
        depositSavingsResult = await this.depositSavingsProcessor.process(
          tx,
          context,
        );

        // 4. Process loan installments (Angsuran Pinjaman)
        loanInstallmentResult = await this.loanInstallmentProcessor.process(
          tx,
          context,
        );

        // 5. Calculate interest (Bunga Simpanan)
        interestResult = await this.interestCalculatorProcessor.process(
          tx,
          context,
        );

        // Calculate grand total
        const grandTotal = membershipResult.totalAmount
          .add(mandatorySavingsResult.totalAmount)
          .add(depositSavingsResult.totalAmount)
          .add(loanInstallmentResult.totalAmount);

        // Finalize payroll period
        await tx.payrollPeriod.update({
          where: { id: payrollPeriod.id },
          data: {
            isProcessed: true,
            processedAt: new Date(),
            totalAmount: grandTotal,
          },
        });
      },
      {
        timeout: 60000, // 60 seconds timeout
        maxWait: 10000,
      },
    );

    const grandTotal = membershipResult.totalAmount
      .add(mandatorySavingsResult.totalAmount)
      .add(depositSavingsResult.totalAmount)
      .add(loanInstallmentResult.totalAmount);

    const summary: PayrollSummary = {
      periodId: payrollPeriod.id,
      periodName: payrollPeriod.name,
      processedAt: new Date(),
      membership: membershipResult,
      mandatorySavings: mandatorySavingsResult,
      depositSavings: depositSavingsResult,
      loanInstallments: loanInstallmentResult,
      interest: interestResult,
      grandTotal,
    };

    this.logger.log('=== Payroll Processing Complete ===');
    this.logger.log(`Grand Total: ${grandTotal}`);

    return summary;
  }

  /**
   * Get payroll status for a period
   */
  async getPayrollStatus(month: number, year: number) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month, year } },
      include: {
        transactions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!period) {
      return null;
    }

    return {
      periodId: period.id,
      periodName: period.name,
      month: period.month,
      year: period.year,
      isProcessed: period.isProcessed,
      processedAt: period.processedAt,
      totalAmount: period.totalAmount.toString(),
      transactionCount: period.transactions.length,
    };
  }

  /**
   * Get payroll history
   */
  async getPayrollHistory(limit = 12) {
    const periods = await this.prisma.payrollPeriod.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return periods.map((p) => ({
      periodId: p.id,
      periodName: p.name,
      month: p.month,
      year: p.year,
      isProcessed: p.isProcessed,
      processedAt: p.processedAt,
      totalAmount: p.totalAmount.toString(),
      transactionCount: p._count.transactions,
    }));
  }

  /**
   * Get detailed transactions for a period
   */
  async getPeriodTransactions(periodId: string) {
    return this.prisma.savingsTransaction.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                employee: {
                  select: {
                    employeeNumber: true,
                    fullName: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Fetch and parse payroll settings
   */
  private async getPayrollSettings(): Promise<PayrollSettings> {
    const settings = await this.prisma.cooperativeSetting.findMany({
      where: {
        key: {
          in: Object.values(PAYROLL_SETTINGS_KEYS),
        },
      },
    });

    const getValue = (key: string, defaultValue: number) => {
      const setting = settings.find((s) => s.key === key);
      return setting ? parseFloat(setting.value) : defaultValue;
    };

    return {
      cutoffDate: getValue(
        PAYROLL_SETTINGS_KEYS.CUTOFF_DATE,
        DEFAULT_VALUES.CUTOFF_DATE,
      ),
      payrollDate: getValue(
        PAYROLL_SETTINGS_KEYS.PAYROLL_DATE,
        DEFAULT_VALUES.PAYROLL_DATE,
      ),
      monthlyMembershipFee: new Prisma.Decimal(
        getValue(
          PAYROLL_SETTINGS_KEYS.MONTHLY_MEMBERSHIP_FEE,
          DEFAULT_VALUES.MONTHLY_MEMBERSHIP_FEE,
        ),
      ),
      depositInterestRate: getValue(
        PAYROLL_SETTINGS_KEYS.DEPOSIT_INTEREST_RATE,
        DEFAULT_VALUES.DEPOSIT_INTEREST_RATE,
      ),
      loanInterestRate: getValue(
        PAYROLL_SETTINGS_KEYS.LOAN_INTEREST_RATE,
        DEFAULT_VALUES.LOAN_INTEREST_RATE,
      ),
      initialMembershipFee: new Prisma.Decimal(
        getValue(
          PAYROLL_SETTINGS_KEYS.INITIAL_MEMBERSHIP_FEE,
          DEFAULT_VALUES.INITIAL_MEMBERSHIP_FEE,
        ),
      ),
    };
  }

  private emptyResult(): ProcessorResult {
    return {
      processedCount: 0,
      totalAmount: new Prisma.Decimal(0),
      errors: [],
      details: [],
    };
  }
}
