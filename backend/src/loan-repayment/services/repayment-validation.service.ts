import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RepaymentValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate if user owns the loan
   */
  async validateLoanOwnership(
    userId: string,
    loanApplicationId: string,
  ): Promise<void> {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }
  }

  /**
   * Check if member agreement is provided
   */
  validateMemberAgreement(isAgreedByMember: boolean): void {
    if (!isAgreedByMember) {
      throw new BadRequestException(
        'Anda harus menyetujui syarat dan ketentuan pelunasan',
      );
    }
  }

  /**
   * Get loan details for repayment
   */
  async getLoanDetails(loanApplicationId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: true,
                golongan: true,
              },
            },
          },
        },
        loanInstallments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    return loan;
  }
}
