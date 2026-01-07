import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanType } from '@prisma/client';

@Injectable()
export class LoanNumberService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate loan number based on type
   */
  async generateLoanNumber(loanType: LoanType): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const prefix = this.getPrefix(loanType);
    
    const lastLoan = await this.prisma.loanApplication.findFirst({
      where: {
        loanNumber: {
          startsWith: `${prefix}-${dateStr}`,
        },
        loanType,
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastLoan) {
      const lastSequence = parseInt(lastLoan.loanNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  private getPrefix(loanType: LoanType): string {
    const prefixMap = {
      [LoanType.CASH_LOAN]: 'LOAN',
      [LoanType.GOODS_REIMBURSE]: 'REIM',
      [LoanType.GOODS_ONLINE]: 'ONLN',
      [LoanType.GOODS_PHONE]: 'PHNE',
    };
    return prefixMap[loanType];
  }
}