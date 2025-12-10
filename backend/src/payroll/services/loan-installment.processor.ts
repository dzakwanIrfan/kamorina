import { Injectable, Logger } from '@nestjs/common';
import { LoanStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class LoanInstallmentProcessor {
  private readonly logger = new Logger(LoanInstallmentProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing loan installments (Angsuran Pinjaman)...');

    // Ambil pinjaman yang sudah dicairkan dan belum lunas
    const activeLoans = await tx.loanApplication.findMany({
      where: {
        status: LoanStatus.DISBURSED,
        disbursedAt: { lte: context.cutoffEnd.toDate() },
      },
      include: {
        user: {
          include: {
            savingsAccount: true,
          },
        },
      },
    });

    this.logger.log(`Found ${activeLoans.length} active loans`);

    // TODO: Implement loan repayment tracking
    // Untuk saat ini, kita perlu menambahkan model LoanRepayment untuk tracking angsuran
    // Schema saat ini belum memiliki tracking untuk:
    // - Berapa angsuran yang sudah dibayar
    // - Sisa pokok
    // - Sisa tenor

    for (const loan of activeLoans) {
      try {
        if (!loan.user.savingsAccount) {
          errors.push({
            userId: loan.userId,
            entityId: loan.id,
            entityType: 'LoanApplication',
            message: `User ${loan.user.name} tidak memiliki Savings Account`,
          });
          continue;
        }

        if (!loan.monthlyInstallment) {
          errors.push({
            userId: loan.userId,
            entityId: loan.id,
            entityType: 'LoanApplication',
            message: `Loan ${loan.loanNumber} tidak memiliki monthly installment`,
          });
          continue;
        }

        const installmentAmount = loan.monthlyInstallment;

        // Note: Untuk implementasi penuh, perlu:
        // 1. Model LoanRepayment untuk track pembayaran
        // 2. Check sisa angsuran
        // 3. Update status jika lunas

        this.logger.debug(
          `Loan ${loan.loanNumber} for ${loan.user.name}:  ${installmentAmount}/month`,
        );

        // Placeholder:  Log saja dulu karena schema belum support full loan tracking
        details.push({
          userId: loan.userId,
          userName: loan.user.name,
          type: 'ANGSURAN_PINJAMAN',
          amount: installmentAmount,
          description: `Angsuran pinjaman ${loan.loanNumber}`,
        });

        totalAmount = totalAmount.add(installmentAmount);
        processedCount++;
      } catch (error) {
        errors.push({
          userId: loan.userId,
          entityId: loan.id,
          entityType: 'LoanApplication',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Loan installment processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
