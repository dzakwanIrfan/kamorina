import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CreateExcessLoanDto } from '../dto/create-loan.dto';
import { UpdateExcessLoanDto } from '../dto/update-loan.dto';
import { ReviseExcessLoanDto } from '../dto/revise-loan.dto';

@Injectable()
export class ExcessLoanHandler implements LoanTypeHandler {
  loanType = LoanType.EXCESS_LOAN;

  constructor(private prisma: PrismaService) {}

  /**
   * Validate loan amount against Social Fund balance (not loan matrix)
   */
  async validateLoanAmount(_userId: string, amount: number): Promise<void> {
    const balance = await this.prisma.socialFundBalance.findFirst();

    if (!balance) {
      throw new BadRequestException('Saldo dana sosial belum diatur');
    }

    const currentBalance = balance.currentBalance.toNumber();

    if (currentBalance <= 0) {
      throw new BadRequestException('Saldo dana sosial saat ini kosong');
    }

    if (amount > currentBalance) {
      throw new BadRequestException(
        `Jumlah pinjaman melebihi saldo dana sosial. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`,
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Jumlah pinjaman harus lebih dari 0');
    }
  }

  async createTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: CreateExcessLoanDto,
  ): Promise<void> {
    await tx.excessLoanDetail.create({
      data: {
        loanApplicationId,
        notes: dto.notes,
      },
    });
  }

  async updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: UpdateExcessLoanDto,
  ): Promise<void> {
    const existing = await tx.excessLoanDetail.findUnique({
      where: { loanApplicationId },
    });

    if (existing && dto.notes !== undefined) {
      await tx.excessLoanDetail.update({
        where: { loanApplicationId },
        data: { notes: dto.notes },
      });
    }
  }

  async reviseTypeSpecificDetails(
    _tx: any,
    _loanApplicationId: string,
    _dto: ReviseExcessLoanDto,
  ): Promise<void> {
    // No specific fields to revise beyond loanAmount (handled in main application)
  }

  getIncludeRelations(): any {
    return {
      excessLoanDetails: true,
    };
  }
}
