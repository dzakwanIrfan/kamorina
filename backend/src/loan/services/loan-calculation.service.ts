import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanType } from '@prisma/client';

@Injectable()
export class LoanCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get setting value as number
   */
  private async getSettingNumber(key: string, defaultValue: number): Promise<number> {
    try {
      const setting = await this.prisma.cooperativeSetting.findUnique({
        where: { key },
      });
      return setting ? parseFloat(setting.value) : defaultValue;
    } catch (error) {
      console.error(`Failed to get setting ${key}, using default:`, defaultValue);
      return defaultValue;
    }
  }

  /**
   * Calculate loan details (interest, installment, total) based on loan type
   */
  async calculateLoanDetails(
    amount: number,
    tenor: number,
    loanType: LoanType,
  ) {
    // Get interest rate from settings
    const annualRate = await this.getSettingNumber('loan_interest_rate', 8);
    
    // Get shop margin rate for online goods
    let shopMarginRate = 0;
    if (loanType === LoanType.GOODS_ONLINE) {
      shopMarginRate = await this.getSettingNumber('shop_margin_rate', 5);
    }

    // Calculate total interest based on loan type
    const totalInterest = amount * (annualRate / 100) * (tenor / 12);
    
    let totalRepayment: number;
    
    switch (loanType) {
      case LoanType.CASH_LOAN:
      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_PHONE:
        // totalRepayment = loanAmount + interestRate
        totalRepayment = amount + totalInterest;
        break;
      
      case LoanType.GOODS_ONLINE:
        // totalRepayment = loanAmount + (loanAmount * shop_margin_rate) + interestRate
        const marginAmount = amount * (shopMarginRate / 100);
        totalRepayment = amount + marginAmount + totalInterest;
        break;
      
      default:
        totalRepayment = amount + totalInterest;
    }

    const monthlyInstallment = totalRepayment / tenor;

    return {
      interestRate: annualRate,
      shopMarginRate: loanType === LoanType.GOODS_ONLINE ? shopMarginRate : null,
      monthlyInstallment: Math.round(monthlyInstallment),
      totalRepayment: Math.round(totalRepayment),
    };
  }
}