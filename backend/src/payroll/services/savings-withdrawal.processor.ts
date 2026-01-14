import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SavingsWithdrawalStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class SavingsWithdrawalProcessor {
  private readonly logger = new Logger(SavingsWithdrawalProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing savings withdrawals (Penarikan Tabungan)...');

    const withdrawals = await tx.savingsWithdrawal.findMany({
      where: {
        status: SavingsWithdrawalStatus.COMPLETED,
        updatedAt: {
          lte: context.cutoffEnd.toDate(),
        },
        activatedAt: null,
      },
      include: {
        user: {
          include: {
            savingsAccount: true,
          },
        },
      },
    });

    this.logger.log(
      `Found ${withdrawals.length} approved withdrawals waiting for disbursement`,
    );

    for (const withdrawal of withdrawals) {
      try {
        const user = withdrawal.user;

        if (!user.savingsAccount) {
          errors.push({
            userId: user.id,
            entityType: 'User',
            message: `User ${user.name} tidak memiliki Savings Account`,
          });
          continue;
        }

        const withdrawalAmount = withdrawal.netAmount;

        // Upsert transaction
        await tx.savingsTransaction.upsert({
          where: {
            savingsAccountId_payrollPeriodId: {
              savingsAccountId: user.savingsAccount.id,
              payrollPeriodId: context.payrollPeriodId,
            },
          },
          update: {
            penarikan: { increment: withdrawalAmount },
          },
          create: {
            savingsAccountId: user.savingsAccount.id,
            payrollPeriodId: context.payrollPeriodId,
            interestRate: context.settings.depositInterestRate,
            penarikan: withdrawalAmount,
          },
        });

        if (user.savingsAccount.saldoSukarela.lessThan(withdrawalAmount)) {
          this.logger.warn(
            `User ${user.name} saldo sukarela kurang dari withdrawal amount!`,
          );
          throw new Error(
            `User ${user.name} saldo sukarela kurang dari withdrawal amount!`,
          );
        }

        await tx.savingsAccount.update({
          where: { id: user.savingsAccount.id },
          data: {
            saldoSukarela: { decrement: withdrawalAmount },
          },
        });

        // Update withdrawal activatedAt
        await tx.savingsWithdrawal.update({
          where: { id: withdrawal.id },
          data: {
            activatedAt: new Date(),
          },
        });

        totalAmount = totalAmount.add(withdrawalAmount);
        processedCount++;

        details.push({
          userId: user.id,
          userName: user.name,
          type: 'PENARIKAN',
          amount: withdrawalAmount,
          description: `Penarikan tabungan ${withdrawal.withdrawalNumber}`,
        });
      } catch (error) {
        errors.push({
          userId: withdrawal.userId,
          entityType: 'SavingsWithdrawal',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Savings withdrawal processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
