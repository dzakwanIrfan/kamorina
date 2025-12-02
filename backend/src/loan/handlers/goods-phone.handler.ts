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
    dto: CreateGoodsPhoneDto,
    shopMarginRate?: number | null,
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
    shopMarginRate?: number | null,
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
    shopMarginRate?: number | null,
  ): Promise<void> {
    // Validate cooperativePrice <= retailPrice
    if (dto.cooperativePrice > dto.retailPrice) {
      throw new BadRequestException(
        'Harga koperasi tidak boleh lebih besar dari harga retail'
      );
    }

    // Validate both prices are positive
    if (dto.retailPrice <= 0 || dto.cooperativePrice <= 0) {
      throw new BadRequestException(
        'Harga retail dan harga koperasi harus lebih dari 0'
      );
    }

    await tx.goodsPhoneDetail. update({
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