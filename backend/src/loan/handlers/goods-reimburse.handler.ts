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

  async validateLoanAmount(userId: string, amount: number): Promise<void> {
    // Get max goods loan from settings (DYNAMIC)
    const maxGoodsLoan = await this.getSettingNumber('max_goods_loan_amount', 15000000);

    if (amount > maxGoodsLoan) {
      throw new BadRequestException(
        `Jumlah pinjaman kredit barang maksimal Rp ${maxGoodsLoan.toLocaleString('id-ID')}`,
      );
    }

    // Get min loan from settings (DYNAMIC)
    const minLoanAmount = await this.getSettingNumber('min_loan_amount', 1000000);

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
    shopMarginRate?: number | null,
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
    shopMarginRate?: number | null,
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
    shopMarginRate?: number | null,
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