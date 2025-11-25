import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CreateGoodsPhoneDto } from '../dto/create-loan.dto';
import { ReviseGoodsPhoneDto } from '../dto/revise-loan.dto';
import { UpdateGoodsPhoneDto } from '../dto/update-loan.dto';

@Injectable()
export class GoodsPhoneHandler implements LoanTypeHandler {
  loanType = LoanType.GOODS_PHONE;

  constructor(private prisma: PrismaService) {}

  async validateLoanAmount(userId: string, amount: number): Promise<void> {
    // For phone, cooperativePrice is the loan amount
    // Set by DSP during revision, so validation happens there
    
    // Get max goods loan from settings (15 juta)
    const maxGoodsLoanSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'max_goods_loan_amount' },
    });
    const maxGoodsLoan = maxGoodsLoanSetting 
      ? parseFloat(maxGoodsLoanSetting.value) 
      : 15000000;

    if (amount > maxGoodsLoan) {
      throw new BadRequestException(
        `Jumlah pinjaman kredit barang maksimal Rp ${maxGoodsLoan.toLocaleString('id-ID')}`,
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
    dto: CreateGoodsPhoneDto,
  ): Promise<void> {
    await tx.goodsPhoneDetail.create({
      data: {
        loanApplicationId,
        itemName: dto.itemName,
        retailPrice: 0, // Will be set by DSP during revision
        cooperativePrice: 0, // Will be set by DSP during revision
        notes: dto.notes,
      },
    });
  }

  async updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: UpdateGoodsPhoneDto,
  ): Promise<void> {
    const existing = await tx.goodsPhoneDetail.findUnique({
      where: { loanApplicationId },
    });

    if (existing) {
      const updateData: any = {};
      if (dto.itemName !== undefined) updateData.itemName = dto.itemName;
      if (dto.notes !== undefined) updateData.notes = dto.notes;

      if (Object.keys(updateData).length > 0) {
        await tx.goodsPhoneDetail.update({
          where: { loanApplicationId },
          data: updateData,
        });
      }
    }
  }

  async reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: ReviseGoodsPhoneDto,
  ): Promise<void> {
    await tx.goodsPhoneDetail.update({
      where: { loanApplicationId },
      data: {
        retailPrice: dto.retailPrice,
        cooperativePrice: dto.cooperativePrice,
      },
    });
  }

  getIncludeRelations(): any {
    return {
      goodsPhoneDetails: true,
    };
  }
}