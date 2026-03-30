import { Injectable, Logger } from '@nestjs/common';
import { LoanType, Prisma, SocialFundTransactionType } from '@prisma/client';
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

    constructor(private prisma: PrismaService) { }

    async process(
        tx: Prisma.TransactionClient,
        context: PayrollContext,
    ): Promise<ProcessorResult> {
        const errors: ProcessorError[] = [];
        const details: ProcessorDetail[] = [];
        let totalAmount = new Prisma.Decimal(0);
        let processedCount = 0;

        this.logger.log('Processing loan installments (Angsuran Pinjaman)...');

        // Installments are processed based on their due date month, not cutoff dates
        const monthStart = context.processDate.startOf('month').toDate();
        const monthEnd = context.processDate.endOf('month').toDate();

        // Get unpaid installments for the current payroll month
        const unpaidInstallments = await tx.loanInstallment.findMany({
            where: {
                isPaid: false,
                dueDate: {
                    gte: monthStart,
                    lte: monthEnd,
                },
                loanApplication: {
                    status: 'DISBURSED',
                },
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
            orderBy: [
                { loanApplicationId: 'asc' },
                { installmentNumber: 'asc' },
            ],
        });

        this.logger.log(
            `Found ${unpaidInstallments.length} unpaid installments to process`,
        );

        for (const installment of unpaidInstallments) {
            try {
                const loan = installment.loanApplication;
                const user = loan.user;

                // Mark installment as paid
                await tx.loanInstallment.update({
                    where: { id: installment.id },
                    data: {
                        isPaid: true,
                        paidAt: context.processDate.toDate(),
                        paidAmount: installment.amount,
                        payrollPeriodId: context.payrollPeriodId,
                        notes: `Dibayar melalui payroll periode ${context.processDate.format('MMMM YYYY')}`,
                    },
                });

                // EXCESS_LOAN: replenish Social Fund with the installment amount
                if (loan.loanType === LoanType.EXCESS_LOAN) {
                    await this.replenishSocialFund(
                        tx,
                        installment.amount,
                        loan.loanNumber,
                        installment.installmentNumber,
                        loan.loanTenor,
                    );
                }

                // Check if all installments are paid
                const remainingUnpaid = await tx.loanInstallment.count({
                    where: {
                        loanApplicationId: loan.id,
                        isPaid: false,
                    },
                });

                // If all paid, update loan status to COMPLETED
                if (remainingUnpaid === 0) {
                    await tx.loanApplication.update({
                        where: { id: loan.id },
                        data: {
                            status: 'COMPLETED' as any, // You might want to add COMPLETED status to LoanStatus enum
                        },
                    });

                    // Create loan history
                    await tx.loanHistory.create({
                        data: {
                            loanApplicationId: loan.id,
                            status: 'COMPLETED' as any,
                            loanType: loan.loanType,
                            loanAmount: loan.loanAmount,
                            loanTenor: loan.loanTenor,
                            loanPurpose: loan.loanPurpose,
                            interestRate: loan.interestRate,
                            monthlyInstallment: loan.monthlyInstallment,
                            action: 'COMPLETED',
                            actionAt: context.processDate.toDate(),
                            notes: 'Semua cicilan telah lunas',
                        },
                    });

                    this.logger.log(
                        `Loan ${loan.loanNumber} fully paid! All installments completed.`,
                    );
                }

                totalAmount = totalAmount.add(installment.amount);
                processedCount++;

                details.push({
                    userId: user.id,
                    userName: user.name,
                    type: 'ANGSURAN_PINJAMAN',
                    amount: installment.amount,
                    description: `Cicilan ${installment.installmentNumber}/${loan.loanTenor} - ${loan.loanNumber}`,
                });

                this.logger.debug(
                    `Processed installment ${installment.installmentNumber}/${loan.loanTenor} for loan ${loan.loanNumber}: ${installment.amount}`,
                );
            } catch (error) {
                errors.push({
                    userId: installment.loanApplication.userId,
                    entityId: installment.id,
                    entityType: 'LoanInstallment',
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

    /**
     * Replenish Social Fund when an EXCESS_LOAN installment is paid
     */
    private async replenishSocialFund(
        tx: Prisma.TransactionClient,
        amount: Prisma.Decimal,
        loanNumber: string,
        installmentNumber: number,
        loanTenor: number,
    ): Promise<void> {
        const balance = await tx.socialFundBalance.findFirst();
        if (!balance) return;

        const newBalance = balance.currentBalance.add(amount);

        await tx.socialFundBalance.update({
            where: { id: balance.id },
            data: { currentBalance: newBalance },
        });

        await tx.socialFundTransaction.create({
            data: {
                type: SocialFundTransactionType.EXCESS_LOAN_REPAYMENT,
                amount,
                balanceAfter: newBalance,
                description: `Cicilan ${installmentNumber}/${loanTenor} Pinjaman Excess ${loanNumber}`,
                createdBy: balance.updatedBy || balance.id,
            },
        });
    }
}