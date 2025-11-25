import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CreateGoodsReimburseDto } from '../dto/create-loan.dto';
import { ReviseGoodsReimburseDto } from '../dto/revise-loan.dto';
import { UpdateGoodsReimburseDto } from '../dto/update-loan.dto';

@Injectable()
export class GoodsReimburseHandler implements LoanTypeHandler {
  loanType = LoanType.GOODS_REIMBURSE;

  constructor(private prisma: PrismaService) {}

  async validateLoanAmount(userId: string, amount: number): Promise<void> {
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
    dto: CreateGoodsReimburseDto,
  ): Promise<void> {
    await tx.goodsReimburseDetail.create({
      data: {
        loanApplicationId,
        itemName: dto.itemName,
        itemPrice: dto.itemPrice,
        purchaseDate: new Date(dto.purchaseDate),
        notes: dto.notes,
      },
    });
  }

  async updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: UpdateGoodsReimburseDto,
  ): Promise<void> {
    const existing = await tx.goodsReimburseDetail.findUnique({
      where: { loanApplicationId },
    });

    if (existing) {
      const updateData: any = {};
      if (dto.itemName !== undefined) updateData.itemName = dto.itemName;
      if (dto.itemPrice !== undefined) updateData.itemPrice = dto.itemPrice;
      if (dto.purchaseDate !== undefined) updateData.purchaseDate = new Date(dto.purchaseDate);
      if (dto.notes !== undefined) updateData.notes = dto.notes;

      if (Object.keys(updateData).length > 0) {
        await tx.goodsReimburseDetail.update({
          where: { loanApplicationId },
          data: updateData,
        });
      }
    }
  }

  async reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: ReviseGoodsReimburseDto,
  ): Promise<void> {
    await tx.goodsReimburseDetail.update({
      where: { loanApplicationId },
      data: {
        itemPrice: dto.itemPrice,
      },
    });
  }

  getIncludeRelations(): any {
    return {
      goodsReimburseDetails: true,
    };
  }
}