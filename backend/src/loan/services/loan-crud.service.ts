import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, LoanType } from '@prisma/client';
import { LoanHandlerFactory } from '../handlers/loan-handler.factory';
import { LoanValidationService } from './loan-validation.service';
import { LoanCalculationService } from './loan-calculation.service';
import { LoanNumberService } from './loan-number.service';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { UpdateLoanDto } from '../dto/update-loan.dto';

@Injectable()
export class LoanCrudService {
  constructor(
    private prisma: PrismaService,
    private loanHandlerFactory: LoanHandlerFactory,
    private validationService: LoanValidationService,
    private calculationService: LoanCalculationService,
    private numberService: LoanNumberService,
  ) {}

  /**
   * Extract loan amount from DTO based on type
   */
  private extractLoanAmount(dto: any, loanType: LoanType): number {
    switch (loanType) {
      case LoanType.CASH_LOAN:
        return dto.loanAmount;
      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_ONLINE:
        return dto.itemPrice;
      case LoanType.GOODS_PHONE:
        // For phone, initial loan amount is 0 (will be set by DSP)
        return 0;
      default:
        throw new BadRequestException('Tipe pinjaman tidak valid');
    }
  }

  /**
   * Create draft loan application
   */
  async createDraft(userId: string, dto: CreateLoanDto) {
    const user = await this.validationService.checkMemberStatus(userId);
    const handler = this.loanHandlerFactory.getHandler(dto.loanType);

    // Extract loan amount based on type
    const loanAmount = this.extractLoanAmount(dto, dto.loanType);

    // Validate loan amount (skip for GOODS_PHONE as it's set by DSP)
    if (dto.loanType !== LoanType.GOODS_PHONE) {
      await handler.validateLoanAmount(userId, loanAmount);
    }

    // Validate tenor
    await this.validationService.validateLoanTenor(dto.loanTenor);

    const bankAccount = dto.bankAccountNumber || user.bankAccountNumber;
    if (!bankAccount) {
      throw new BadRequestException('Nomor rekening wajib diisi');
    }

    const loanNumber = await this.numberService.generateLoanNumber(dto.loanType);
    
    // Calculate loan details (skip for GOODS_PHONE)
    let calculations: { 
      interestRate: number | null; 
      shopMarginRate: number | null;
      monthlyInstallment: number | null; 
      totalRepayment: number | null;
    } = {
      interestRate: null,
      shopMarginRate: null,
      monthlyInstallment: null,
      totalRepayment: null,
    };
    
    if (dto.loanType !== LoanType.GOODS_PHONE && loanAmount > 0) {
      calculations = await this.calculationService.calculateLoanDetails(
        loanAmount, 
        dto.loanTenor,
        dto.loanType
      );
    }

    const loan = await this.prisma.$transaction(async (tx) => {
      // Create main loan application
      const loanApp = await tx.loanApplication.create({
        data: {
          loanNumber,
          userId,
          loanType: dto.loanType,
          bankAccountNumber: bankAccount,
          loanAmount,
          loanTenor: dto.loanTenor,
          loanPurpose: dto.loanPurpose,
          attachments: dto.attachments || [],
          status: LoanStatus.DRAFT,
          interestRate: calculations.interestRate,
          monthlyInstallment: calculations.monthlyInstallment,
          totalRepayment: calculations.totalRepayment,
        },
      });

      // Create type-specific details (pass shopMarginRate for GOODS_ONLINE)
      await handler.createTypeSpecificDetails(tx, loanApp.id, dto, calculations.shopMarginRate);

      return loanApp;
    });

    // Update user bank account if provided and different
    if (dto.bankAccountNumber && dto.bankAccountNumber !== user.bankAccountNumber) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { bankAccountNumber: dto.bankAccountNumber },
      });
    }

    // Fetch complete loan with relations
    const completeLoan = await this.prisma.loanApplication.findUnique({
      where: { id: loan.id },
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
        ...handler.getIncludeRelations(),
      },
    });

    return {
      message: 'Draft pinjaman berhasil dibuat',
      loan: completeLoan,
    };
  }

  /**
   * Update draft loan
   */
  async updateDraft(userId: string, loanId: string, dto: UpdateLoanDto) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa diupdate');
    }

    const handler = this.loanHandlerFactory.getHandler(loan.loanType);

    // Extract new loan amount if provided
    let newLoanAmount = loan.loanAmount.toNumber();
    if ('loanAmount' in dto && dto.loanAmount !== undefined) {
      newLoanAmount = this.extractLoanAmount(dto, loan.loanType);
      
      // Validate new amount (skip for GOODS_PHONE)
      if (loan.loanType !== LoanType.GOODS_PHONE) {
        await handler.validateLoanAmount(userId, newLoanAmount);
      }
    }

    // Validate new tenor if provided
    if (dto.loanTenor !== undefined) {
      await this.validationService.validateLoanTenor(dto.loanTenor);
    }

    const updateData: any = {};

    if (dto.bankAccountNumber !== undefined) updateData.bankAccountNumber = dto.bankAccountNumber;
    if (dto.loanTenor !== undefined) updateData.loanTenor = dto.loanTenor;
    if (dto.loanPurpose !== undefined) updateData.loanPurpose = dto.loanPurpose;
    if (dto.attachments !== undefined) updateData.attachments = dto.attachments;

    // Update loan amount based on type
    if (("loanAmount" in dto && dto.loanAmount !== undefined) || ("itemPrice" in dto && dto.itemPrice !== undefined)) {
      updateData.loanAmount = newLoanAmount;
    }

    // Recalculate if amount or tenor changed (skip for GOODS_PHONE)
    let shopMarginRate: number | null = null;
    if ((updateData.loanAmount !== undefined || updateData.loanTenor !== undefined) && 
        loan.loanType !== LoanType.GOODS_PHONE && 
        newLoanAmount > 0) {
      const amount = updateData.loanAmount ?? loan.loanAmount.toNumber();
      const tenor = updateData.loanTenor ?? loan.loanTenor;
      const calculations = await this.calculationService.calculateLoanDetails(
        amount, 
        tenor,
        loan.loanType
      );
      updateData.interestRate = calculations.interestRate;
      updateData.monthlyInstallment = calculations.monthlyInstallment;
      updateData.totalRepayment = calculations.totalRepayment;
      shopMarginRate = calculations.shopMarginRate;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update main loan application
      const loanApp = await tx.loanApplication.update({
        where: { id: loanId },
        data: updateData,
      });

      // Update type-specific details (pass shopMarginRate for GOODS_ONLINE)
      await handler.updateTypeSpecificDetails(tx, loanId, dto, shopMarginRate);

      return loanApp;
    });

    // Fetch complete loan with relations
    const completeLoan = await this.prisma.loanApplication.findUnique({
      where: { id: updated.id },
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
        ...handler.getIncludeRelations(),
      },
    });

    return {
      message: 'Draft pinjaman berhasil diupdate',
      loan: completeLoan,
    };
  }

  /**
   * Delete draft loan
   */
  async deleteDraft(userId: string, loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa dihapus');
    }

    await this.prisma.loanApplication.delete({
      where: { id: loanId },
    });

    return { message: 'Draft pinjaman berhasil dihapus' };
  }
}