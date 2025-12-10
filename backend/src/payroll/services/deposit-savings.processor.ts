import { Injectable, Logger } from '@nestjs/common';
import { DepositStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class DepositSavingsProcessor {
  private readonly logger = new Logger(DepositSavingsProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing deposit savings (Tabungan Deposito)...');

    // Ambil deposit yang masih aktif atau baru diapprove
    const activeDeposits = await tx.depositApplication.findMany({
      where: {
        status: {
          in: [DepositStatus.APPROVED, DepositStatus.ACTIVE],
        },
        approvedAt: { lte: context.cutoffEnd.toDate() },
      },
      include: {
        user: {
          include: {
            savingsAccount: true,
          },
        },
      },
    });

    this.logger.log(`Found ${activeDeposits.length} active deposits`);

    for (const deposit of activeDeposits) {
      try {
        if (!deposit.user.savingsAccount) {
          errors.push({
            userId: deposit.userId,
            entityId: deposit.id,
            entityType: 'DepositApplication',
            message: `User ${deposit.user.name} tidak memiliki Savings Account`,
          });
          continue;
        }

        // Skip jika sudah mencapai tenor
        if (deposit.installmentCount >= deposit.tenorMonths) {
          this.logger.debug(
            `Deposit ${deposit.depositNumber} already completed`,
          );
          continue;
        }

        const deduction = deposit.amountValue;

        // Upsert transaction
        await tx.savingsTransaction.upsert({
          where: {
            savingsAccountId_payrollPeriodId: {
              savingsAccountId: deposit.user.savingsAccount.id,
              payrollPeriodId: context.payrollPeriodId,
            },
          },
          update: {
            tabunganDeposito: { increment: deduction },
          },
          create: {
            savingsAccountId: deposit.user.savingsAccount.id,
            payrollPeriodId: context.payrollPeriodId,
            interestRate: context.settings.depositInterestRate,
            tabunganDeposito: deduction,
          },
        });

        // Calculate new values
        const newCollected = deposit.collectedAmount.add(deduction);
        const newCount = deposit.installmentCount + 1;
        const isCompleted = newCount >= deposit.tenorMonths;

        // Determine new status
        let newStatus = deposit.status;
        if (deposit.status === DepositStatus.APPROVED) {
          newStatus = DepositStatus.ACTIVE;
        }
        if (isCompleted) {
          newStatus = DepositStatus.COMPLETED;
        }

        // Update deposit application
        await tx.depositApplication.update({
          where: { id: deposit.id },
          data: {
            status: newStatus,
            collectedAmount: newCollected,
            installmentCount: newCount,
            activatedAt:
              deposit.status === DepositStatus.APPROVED
                ? context.processDate.toDate()
                : deposit.activatedAt,
            completedAt: isCompleted ? context.processDate.toDate() : null,
          },
        });

        // Update savings account
        await tx.savingsAccount.update({
          where: { id: deposit.user.savingsAccount.id },
          data: {
            saldoSukarela: { increment: deduction },
          },
        });

        // Create deposit history
        await tx.depositHistory.create({
          data: {
            depositApplicationId: deposit.id,
            status: newStatus,
            amountValue: deposit.amountValue,
            tenorMonths: deposit.tenorMonths,
            action: isCompleted ? 'COMPLETED' : `INSTALLMENT_${newCount}`,
            actionAt: context.processDate.toDate(),
            notes: `Cicilan ke-${newCount} dari ${deposit.tenorMonths} bulan`,
          },
        });

        totalAmount = totalAmount.add(deduction);
        processedCount++;

        details.push({
          userId: deposit.userId,
          userName: deposit.user.name,
          type: 'TABUNGAN_DEPOSITO',
          amount: deduction,
          description: `Tabungan deposito cicilan ke-${newCount}/${deposit.tenorMonths}`,
        });

        this.logger.debug(
          `Processed deposit for ${deposit.user.name}: ${deduction} (${newCount}/${deposit.tenorMonths})`,
        );
      } catch (error) {
        errors.push({
          userId: deposit.userId,
          entityId: deposit.id,
          entityType: 'DepositApplication',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Deposit savings processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
