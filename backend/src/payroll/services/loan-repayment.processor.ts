import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RepaymentStatus, LoanStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class LoanRepaymentProcessor {
  private readonly logger = new Logger(LoanRepaymentProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Processing loan repayments (Pelunasan Pinjaman)...');

    const approvedRepayments = await tx.loanRepayment.findMany({
      where: {
        status: RepaymentStatus.APPROVED,
        approvedAt: { lte: context.cutoffEnd.toDate() },
      },
      include: {
        loanApplication: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Found ${approvedRepayments.length} approved repayments to process`,
    );

    for (const repayment of approvedRepayments) {
      try {
        const loan = repayment.loanApplication;
        const user = loan.user;
        const repaymentAmount = repayment.totalAmount;

        // 1. Update status repayment menjadi COMPLETED
        await tx.loanRepayment.update({
          where: { id: repayment.id },
          data: {
            status: RepaymentStatus.COMPLETED,
            updatedAt: new Date(),
          },
        });

        // 2. Update status loan menjadi COMPLETED
        await tx.loanApplication.update({
          where: { id: loan.id },
          data: {
            status: LoanStatus.COMPLETED,
            updatedAt: new Date(),
          },
        });

        // 3. Create Loan History
        await tx.loanHistory.create({
          data: {
            loanApplicationId: loan.id,
            status: LoanStatus.COMPLETED,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            loanTenor: loan.loanTenor,
            loanPurpose: loan.loanPurpose,
            interestRate: loan.interestRate,
            monthlyInstallment: loan.monthlyInstallment,
            action: 'REPAYMENT_COMPLETED',
            actionAt: context.processDate.toDate(),
            notes: `Pelunasan via payroll periode ${context.processDate.format(
              'MMMM YYYY',
            )}`,
          },
        });

        // 4. Update LoanInstallment yang tersisa menjadi paid
        await tx.loanInstallment.updateMany({
          where: {
            loanApplicationId: loan.id,
            isPaid: false,
          },
          data: {
            isPaid: true,
            paidAt: context.processDate.toDate(),
            paidAmount: loan.monthlyInstallment,
            payrollPeriodId: context.payrollPeriodId,
            notes: `Dilunasi melalui pengajuan pelunasan ${repayment.repaymentNumber}`,
          },
        });

        totalAmount = totalAmount.add(repaymentAmount);
        processedCount++;

        details.push({
          userId: user.id,
          userName: user.name,
          type: 'PELUNASAN_PINJAMAN',
          amount: repaymentAmount,
          description: `Pelunasan Pinjaman ${loan.loanNumber}`,
        });

        this.logger.debug(
          `Processed repayment ${repayment.repaymentNumber} for loan ${loan.loanNumber}: ${repaymentAmount}`,
        );
      } catch (error) {
        errors.push({
          userId: repayment.userId,
          entityId: repayment.id,
          entityType: 'LoanRepayment',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Loan repayment processing complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
