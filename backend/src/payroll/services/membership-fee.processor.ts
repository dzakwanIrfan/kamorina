import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';
import { INSTALLMENT_PLANS } from '../constants/payroll.constants';

@Injectable()
export class MembershipFeeProcessor {
  private readonly logger = new Logger(MembershipFeeProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing membership fees (Simpanan Pokok)...');

    // Ambil member baru yang belum lunas
    const pendingMembers = await tx.memberApplication.findMany({
      where: {
        status: 'APPROVED',
        isPaidOff: false,
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

    this.logger.log(`Found ${pendingMembers.length} pending membership fees`);

    for (const app of pendingMembers) {
      try {
        if (!app.user.savingsAccount) {
          errors.push({
            userId: app.userId,
            entityId: app.id,
            entityType: 'MemberApplication',
            message: `User ${app.user.name} tidak memiliki Savings Account`,
          });
          continue;
        }

        const deduction = this.calculateDeduction(app);

        if (deduction.lte(0)) {
          continue;
        }

        const note = `Setoran koperasi dari potongan gaji periode ${context.cutoffStart.format(
          'DD MMMM YYYY',
        )} s/d ${context.cutoffEnd.format('DD MMMM YYYY')}`;

        // Upsert transaction
        await tx.savingsTransaction.upsert({
          where: {
            savingsAccountId_payrollPeriodId: {
              savingsAccountId: app.user.savingsAccount.id,
              payrollPeriodId: context.payrollPeriodId,
            },
          },
          update: {
            iuranPendaftaran: { increment: deduction },
            note,
          },
          create: {
            savingsAccountId: app.user.savingsAccount.id,
            payrollPeriodId: context.payrollPeriodId,
            interestRate: context.settings.depositInterestRate,
            iuranPendaftaran: deduction,
            note,
          },
        });

        // Update member application
        const newPaid = app.paidAmount.add(deduction);
        const newRemaining = app.remainingAmount.sub(deduction);
        const isLunas = newRemaining.lte(0);

        await tx.memberApplication.update({
          where: { id: app.id },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining.lt(0)
              ? new Prisma.Decimal(0)
              : newRemaining,
            isPaidOff: isLunas,
          },
        });

        // Update savings account
        await tx.savingsAccount.update({
          where: { id: app.user.savingsAccount.id },
          data: {
            saldoPokok: { increment: deduction },
          },
        });

        totalAmount = totalAmount.add(deduction);
        processedCount++;

        details.push({
          userId: app.userId,
          userName: app.user.name,
          type: 'IURAN_PENDAFTARAN',
          amount: deduction,
          description: `Cicilan ke-${app.paidAmount.gt(0) ? 2 : 1} simpanan pokok`,
        });

        this.logger.debug(
          `Processed membership fee for ${app.user.name}: ${deduction}`,
        );
      } catch (error) {
        errors.push({
          userId: app.userId,
          entityId: app.id,
          entityType: 'MemberApplication',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Membership fee processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }

  private calculateDeduction(app: {
    installmentPlan: number;
    entranceFee: Prisma.Decimal;
    paidAmount: Prisma.Decimal;
    remainingAmount: Prisma.Decimal;
  }): Prisma.Decimal {
    if (app.installmentPlan === INSTALLMENT_PLANS.FULL_PAYMENT) {
      // Lunas langsung
      return app.remainingAmount;
    }

    if (app.installmentPlan === INSTALLMENT_PLANS.TWO_INSTALLMENTS) {
      if (app.paidAmount.equals(0)) {
        // Cicilan pertama (50%)
        return app.entranceFee.div(2);
      }
      // Cicilan kedua (sisa)
      return app.remainingAmount;
    }

    return new Prisma.Decimal(0);
  }
}
