import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CreateGoodsOnlineDto } from '../dto/create-loan.dto';
import { ReviseGoodsOnlineDto } from '../dto/revise-loan.dto';
import { UpdateGoodsOnlineDto } from '../dto/update-loan.dto';

@Injectable()
export class GoodsOnlineHandler implements LoanTypeHandler {
  loanType = LoanType.GOODS_ONLINE;

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
    dto: CreateGoodsOnlineDto,
    shopMarginRate?: number | null,
  ): Promise<void> {
    // Get shop margin rate from settings if not provided (DYNAMIC)
    const marginRate = shopMarginRate ?? await this.getSettingNumber('shop_margin_rate', 5);

    await tx.goodsOnlineDetail.create({
      data: {
        loanApplicationId,
        itemName: dto.itemName,
        itemPrice: dto.itemPrice,
        itemUrl: dto.itemUrl,
        shopMarginRate: marginRate,
        notes: dto.notes,
      },
    });
  }

  async updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: UpdateGoodsOnlineDto,
    shopMarginRate?: number | null,
  ): Promise<void> {
    const existing = await tx.goodsOnlineDetail.findUnique({
      where: { loanApplicationId },
    });

    if (existing) {
      const updateData: any = {};
      if (dto.itemName !== undefined) updateData.itemName = dto.itemName;
      if (dto.itemPrice !== undefined) updateData.itemPrice = dto.itemPrice;
      if (dto.itemUrl !== undefined) updateData.itemUrl = dto.itemUrl;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (shopMarginRate !== undefined && shopMarginRate !== null) {
        updateData.shopMarginRate = shopMarginRate;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.goodsOnlineDetail.update({
          where: { loanApplicationId },
          data: updateData,
        });
      }
    }
  }

  async reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: ReviseGoodsOnlineDto,
    shopMarginRate?: number | null,
  ): Promise<void> {
    const updateData: any = {
      itemPrice: dto.itemPrice,
    };
    
    if (shopMarginRate !== undefined && shopMarginRate !== null) {
      updateData.shopMarginRate = shopMarginRate;
    }
    
    await tx.goodsOnlineDetail.update({
      where: { loanApplicationId },
      data: updateData,
    });
  }

  getIncludeRelations(): any {
    return {
      goodsOnlineDetails: true,
    };
  }
}