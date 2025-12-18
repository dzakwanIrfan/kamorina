import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class LoanInstallmentService {
    private readonly logger = new Logger(LoanInstallmentService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Generate installment schedule when loan is disbursed
     */
    async generateInstallmentSchedule(
        loanApplicationId: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const prisma = tx || this.prisma;

        const loan = await prisma.loanApplication.findUnique({
            where: { id: loanApplicationId },
        });

        if (!loan) {
            throw new Error('Loan application not found');
        }

        if (loan.status !== LoanStatus.DISBURSED) {
            throw new Error('Loan must be disbursed before generating installments');
        }

        // Check if installments already exist
        const existingCount = await prisma.loanInstallment.count({
            where: { loanApplicationId },
        });

        if (existingCount > 0) {
            this.logger.warn(
                `Installments already exist for loan ${loan.loanNumber}`,
            );
            return;
        }

        const settings = await this.getPayrollSettings(prisma);
        const disbursedDate = loan.disbursedAt || new Date();
        const startDate = dayjs(disbursedDate);

        // Calculate first due date (next payroll date after cutoff)
        let firstDueDate = this.calculateNextDueDate(startDate, settings);

        const installments: Prisma.LoanInstallmentCreateManyInput[] = [];

        for (let i = 1; i <= loan.loanTenor; i++) {
            const dueDate = firstDueDate.add(i - 1, 'month').toDate();

            installments.push({
                loanApplicationId,
                installmentNumber: i,
                dueDate,
                amount: loan.monthlyInstallment || 0,
                isPaid: false,
            });
        }

        await prisma.loanInstallment.createMany({
            data: installments,
        });

        this.logger.log(
            `Generated ${installments.length} installments for loan ${loan.loanNumber}`,
        );
    }

    /**
     * Calculate next due date based on cutoff and payroll date
     */
    private calculateNextDueDate(
        fromDate: dayjs.Dayjs,
        settings: { cutoffDate: number; payrollDate: number },
    ): dayjs.Dayjs {
        const { cutoffDate, payrollDate } = settings;
        let dueDate = fromDate.set('date', payrollDate);

        // If disbursed after cutoff date of current month, use next month's payroll
        if (fromDate.date() > cutoffDate) {
            dueDate = dueDate.add(1, 'month');
        }

        return dueDate;
    }

    /**
     * Get payroll settings
     */
    private async getPayrollSettings(
        prisma: Prisma.TransactionClient | PrismaService,
    ): Promise<{ cutoffDate: number; payrollDate: number }> {
        const settings = await prisma.cooperativeSetting.findMany({
            where: {
                key: {
                    in: ['cooperative_cutoff_date', 'cooperative_payroll_date'],
                },
            },
        });

        const cutoffDate =
            parseInt(
                settings.find((s) => s.key === 'cooperative_cutoff_date')?.value || '15',
            ) || 15;
        const payrollDate =
            parseInt(
                settings.find((s) => s.key === 'cooperative_payroll_date')?.value ||
                '27',
            ) || 27;

        return { cutoffDate, payrollDate };
    }

    /**
     * Get unpaid installments for a period
     */
    async getUnpaidInstallments(cutoffEnd: Date) {
        return this.prisma.loanInstallment.findMany({
            where: {
                isPaid: false,
                dueDate: { lte: cutoffEnd },
                loanApplication: {
                    status: LoanStatus.DISBURSED,
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
                                        department: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [{ loanApplicationId: 'asc' }, { installmentNumber: 'asc' }],
        });
    }

    /**
     * Mark installment as paid
     */
    async markAsPaid(
        installmentId: string,
        payrollPeriodId: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const prisma = tx || this.prisma;

        await prisma.loanInstallment.update({
            where: { id: installmentId },
            data: {
                isPaid: true,
                paidAt: new Date(),
                paidAmount: await prisma.loanInstallment
                    .findUnique({ where: { id: installmentId } })
                    .then((i) => i?.amount),
                payrollPeriodId,
            },
        });
    }

    /**
     * Get installment summary for a loan
     */
    async getLoanInstallmentSummary(loanApplicationId: string) {
        const installments = await this.prisma.loanInstallment.findMany({
            where: { loanApplicationId },
            orderBy: { installmentNumber: 'asc' },
        });

        const totalPaid = installments.filter((i) => i.isPaid).length;
        const totalUnpaid = installments.filter((i) => !i.isPaid).length;
        const totalPaidAmount = installments
            .filter((i) => i.isPaid)
            .reduce((sum, i) => sum.add(i.paidAmount || 0), new Prisma.Decimal(0));
        const totalUnpaidAmount = installments
            .filter((i) => !i.isPaid)
            .reduce((sum, i) => sum.add(i.amount), new Prisma.Decimal(0));

        return {
            totalInstallments: installments.length,
            paidInstallments: totalPaid,
            unpaidInstallments: totalUnpaid,
            totalPaidAmount: totalPaidAmount.toString(),
            totalUnpaidAmount: totalUnpaidAmount.toString(),
            installments: installments.map((i) => ({
                id: i.id,
                installmentNumber: i.installmentNumber,
                dueDate: i.dueDate,
                amount: i.amount.toString(),
                isPaid: i.isPaid,
                paidAt: i.paidAt,
                paidAmount: i.paidAmount?.toString(),
            })),
        };
    }
}