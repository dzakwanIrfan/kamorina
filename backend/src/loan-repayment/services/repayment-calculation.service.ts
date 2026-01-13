import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class RepaymentCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate total repayment amount
   * Total amount = Total repayment - Sum of paid installments
   */
  async calculateRepaymentAmount(loanApplicationId: string): Promise<{
    totalLoanAmount: Decimal;
    totalPaid: Decimal;
    remainingAmount: Decimal;
    paidInstallments: number;
    totalInstallments: number;
  }> {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: {
        loanInstallments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!loan) {
      throw new BadRequestException('Pinjaman tidak ditemukan');
    }

    const totalLoanAmount = loan.totalRepayment || new Decimal(0);

    // Calculate total paid from installments
    const paidInstallments = loan.loanInstallments.filter((i) => i.isPaid);
    const totalPaid = paidInstallments.reduce(
      (sum, inst) => sum.add(inst.paidAmount || new Decimal(0)),
      new Decimal(0),
    );

    const remainingAmount = totalLoanAmount.minus(totalPaid);

    return {
      totalLoanAmount,
      totalPaid,
      remainingAmount,
      paidInstallments: paidInstallments.length,
      totalInstallments: loan.loanInstallments.length,
    };
  }

  /**
   * Validate if repayment is allowed
   */
  async validateRepaymentEligibility(loanApplicationId: string): Promise<void> {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: {
        loanInstallments: true,
      },
    });

    if (!loan) {
      throw new BadRequestException('Pinjaman tidak ditemukan');
    }

    // Check if loan is disbursed
    if (loan.status !== 'DISBURSED') {
      throw new BadRequestException(
        'Hanya pinjaman yang sudah dicairkan yang dapat dilunasi',
      );
    }

    // Check if loan already has pending repayment
    const existingRepayment = await this.prisma.loanRepayment.findFirst({
      where: {
        loanApplicationId,
        status: {
          in: ['UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA'],
        },
      },
    });

    if (existingRepayment) {
      throw new BadRequestException(
        'Sudah ada pengajuan pelunasan yang sedang diproses untuk pinjaman ini',
      );
    }

    // Calculate remaining amount
    const calculation = await this.calculateRepaymentAmount(loanApplicationId);

    if (calculation.remainingAmount.lte(0)) {
      throw new BadRequestException('Pinjaman sudah lunas');
    }
  }
}
