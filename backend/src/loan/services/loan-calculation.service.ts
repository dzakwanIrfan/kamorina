import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoanCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate loan details (interest, installment, total)
   */
  async calculateLoanDetails(amount: number, tenor: number) {
    const interestSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'loan_interest_rate' },
    });

    const annualRate = interestSetting ? parseFloat(interestSetting.value) : 12;
    const monthlyRate = annualRate / 12 / 100;

    // Simple flat rate calculation
    const totalInterest = amount * (annualRate / 100) * (tenor / 12);
    const totalRepayment = amount + totalInterest;
    const monthlyInstallment = totalRepayment / tenor;

    return {
      interestRate: annualRate,
      monthlyInstallment: Math.round(monthlyInstallment),
      totalRepayment: Math.round(totalRepayment),
    };
  }
}