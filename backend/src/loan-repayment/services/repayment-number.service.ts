import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RepaymentNumberService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate repayment number:  REPM-YYYYMMDD-XXXX
   */
  async generateRepaymentNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastRepayment = await this.prisma.loanRepayment.findFirst({
      where: {
        repaymentNumber: {
          startsWith: `REPM-${dateStr}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastRepayment) {
      const lastSequence = parseInt(
        lastRepayment.repaymentNumber.split('-')[2],
      );
      sequence = lastSequence + 1;
    }

    return `REPM-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
}
