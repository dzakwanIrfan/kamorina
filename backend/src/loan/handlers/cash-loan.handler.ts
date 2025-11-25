import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CreateCashLoanDto } from '../dto/create-loan.dto';
import { ReviseCashLoanDto } from '../dto/revise-loan.dto';
import { UpdateCashLoanDto } from '../dto/update-loan.dto';

@Injectable()
export class CashLoanHandler implements LoanTypeHandler {
  loanType = LoanType.CASH_LOAN;

  constructor(private prisma: PrismaService) {}

  async validateLoanAmount(userId: string, amount: number): Promise<void> {
    // Get user with employee and golongan data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            golongan: true,
          },
        },
      },
    });

    if (!user || !user.employee) {
      throw new BadRequestException('Data karyawan tidak ditemukan');
    }

    // Calculate years of service
    const yearsOfService = this.calculateYearsOfService(user.employee.employeeNumber);

    // Find matching loan limit
    const loanLimit = await this.prisma.loanLimitMatrix.findFirst({
      where: {
        golonganId: user.employee.golonganId,
        minYearsOfService: { lte: yearsOfService },
        OR: [
          { maxYearsOfService: { gte: yearsOfService } },
          { maxYearsOfService: null },
        ],
      },
    });

    if (!loanLimit) {
      throw new BadRequestException('Plafond pinjaman tidak ditemukan');
    }

    const maxLoanAmount = Number(loanLimit.maxLoanAmount);

    if (amount > maxLoanAmount) {
      throw new BadRequestException(
        `Jumlah pinjaman maksimal Rp ${maxLoanAmount.toLocaleString('id-ID')}`,
      );
    }

    // Get min loan from settings
    const minLoanSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'min_loan_amount' },
    });
    const minLoanAmount = minLoanSetting ? parseFloat(minLoanSetting.value) : 1000000;

    if (amount < minLoanAmount) {
      throw new BadRequestException(
        `Jumlah pinjaman minimal Rp ${minLoanAmount.toLocaleString('id-ID')}`,
      );
    }
  }

  async createTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: CreateCashLoanDto,
  ): Promise<void> {
    await tx.cashLoanDetail.create({
      data: {
        loanApplicationId,
        notes: dto.notes,
      },
    });
  }

  async updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: UpdateCashLoanDto,
  ): Promise<void> {
    const existing = await tx.cashLoanDetail.findUnique({
      where: { loanApplicationId },
    });

    if (existing && dto.notes !== undefined) {
      await tx.cashLoanDetail.update({
        where: { loanApplicationId },
        data: { notes: dto.notes },
      });
    }
  }

  async reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: ReviseCashLoanDto,
  ): Promise<void> {
    // No specific fields to revise for cash loan
    // loanAmount is already handled in main loan application
  }

  getIncludeRelations(): any {
    return {
      cashLoanDetails: true,
    };
  }

  private calculateYearsOfService(employeeNumber: string): number {
    if (!employeeNumber || employeeNumber.length < 4) {
      return 0;
    }

    const yearMonth = employeeNumber.substring(1, 4);
    const year = parseInt('20' + yearMonth.substring(0, 2));
    const month = parseInt(yearMonth.substring(2, 3));

    const hireDate = new Date(year, month - 1, 1);
    const now = new Date();

    let years = now.getFullYear() - hireDate.getFullYear();
    const monthDiff = now.getMonth() - hireDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
      years--;
    }

    return Math.max(0, years);
  }
}