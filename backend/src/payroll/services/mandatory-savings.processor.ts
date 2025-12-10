import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class MandatorySavingsProcessor {
  private readonly logger = new Logger(MandatorySavingsProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing mandatory savings (Simpanan Wajib)...');

    // Ambil semua member aktif
    const activeMembers = await tx.user.findMany({
      where: {
        memberVerified: true,
        savingsAccount: { isNot: null },
      },
      include: {
        savingsAccount: true,
      },
    });

    this.logger.log(`Found ${activeMembers.length} active members`);

    const monthlyFee = context.settings.monthlyMembershipFee;

    for (const user of activeMembers) {
      try {
        if (!user.savingsAccount) {
          errors.push({
            userId: user.id,
            entityType: 'User',
            message: `User ${user.name} tidak memiliki Savings Account`,
          });
          continue;
        }

        // Upsert transaction
        await tx.savingsTransaction.upsert({
          where: {
            savingsAccountId_payrollPeriodId: {
              savingsAccountId: user.savingsAccount.id,
              payrollPeriodId: context.payrollPeriodId,
            },
          },
          update: {
            iuranBulanan: monthlyFee,
          },
          create: {
            savingsAccountId: user.savingsAccount.id,
            payrollPeriodId: context.payrollPeriodId,
            interestRate: context.settings.depositInterestRate,
            iuranBulanan: monthlyFee,
          },
        });

        // Update savings account
        await tx.savingsAccount.update({
          where: { id: user.savingsAccount.id },
          data: {
            saldoWajib: { increment: monthlyFee },
          },
        });

        totalAmount = totalAmount.add(monthlyFee);
        processedCount++;

        details.push({
          userId: user.id,
          userName: user.name,
          type: 'IURAN_BULANAN',
          amount: monthlyFee,
          description: 'Simpanan wajib bulanan',
        });
      } catch (error) {
        errors.push({
          userId: user.id,
          entityType: 'User',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Mandatory savings processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
