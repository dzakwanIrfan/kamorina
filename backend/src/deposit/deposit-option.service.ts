import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositAmountDto } from './dto/create-deposit-amount.dto';
import { UpdateDepositAmountDto } from './dto/update-deposit-amount.dto';
import { CreateDepositTenorDto } from './dto/create-deposit-tenor.dto';
import { UpdateDepositTenorDto } from './dto/update-deposit-tenor.dto';
import { QueryDepositOptionDto } from './dto/query-deposit-option.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepositOptionService {
  constructor(private prisma: PrismaService) {}

  // DEPOSIT AMOUNT OPTIONS

  async createAmountOption(dto: CreateDepositAmountDto) {
    const existing = await this.prisma.depositAmountOption.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Kode jumlah deposito sudah ada');
    }

    return this.prisma.depositAmountOption.create({
      data: {
        code: dto.code,
        label: dto.label,
        amount: dto.amount,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAllAmountOptions(query: QueryDepositOptionDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepositAmountOptionWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.depositAmountOption.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.depositAmountOption.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllActiveAmountOptions() {
    return this.prisma.depositAmountOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAmountOptionById(id: string) {
    const option = await this.prisma.depositAmountOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException('Opsi jumlah deposito tidak ditemukan');
    }

    return option;
  }

  async findAmountOptionByCode(code: string) {
    const option = await this.prisma.depositAmountOption.findUnique({
      where: { code },
    });

    if (!option) {
      throw new NotFoundException('Opsi jumlah deposito tidak ditemukan');
    }

    return option;
  }

  async updateAmountOption(id: string, dto: UpdateDepositAmountDto) {
    await this.findAmountOptionById(id);

    if (dto.code) {
      const existing = await this.prisma.depositAmountOption.findFirst({
        where: {
          code: dto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Kode jumlah deposito sudah ada');
      }
    }

    return this.prisma.depositAmountOption.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAmountOption(id: string) {
    const option = await this.findAmountOptionById(id);

    const usedCount = await this.prisma.depositApplication.count({
      where: { depositAmountCode: option.code },
    });

    if (usedCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus. Opsi ini digunakan di ${usedCount} pengajuan deposito.`,
      );
    }

    await this.prisma.depositAmountOption.delete({
      where: { id },
    });

    return { message: `Opsi jumlah "${option.label}" berhasil dihapus` };
  }

  // DEPOSIT TENOR OPTIONS

  async createTenorOption(dto: CreateDepositTenorDto) {
    const existing = await this.prisma.depositTenorOption.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Kode tenor deposito sudah ada');
    }

    return this.prisma.depositTenorOption.create({
      data: {
        code: dto.code,
        label: dto.label,
        months: dto.months,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAllTenorOptions(query: QueryDepositOptionDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepositTenorOptionWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.depositTenorOption.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.depositTenorOption.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllActiveTenorOptions() {
    return this.prisma.depositTenorOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTenorOptionById(id: string) {
    const option = await this.prisma.depositTenorOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException('Opsi tenor deposito tidak ditemukan');
    }

    return option;
  }

  async findTenorOptionByCode(code: string) {
    const option = await this.prisma.depositTenorOption.findUnique({
      where: { code },
    });

    if (!option) {
      throw new NotFoundException('Opsi tenor deposito tidak ditemukan');
    }

    return option;
  }

  async updateTenorOption(id: string, dto: UpdateDepositTenorDto) {
    await this.findTenorOptionById(id);

    if (dto.code) {
      const existing = await this.prisma.depositTenorOption.findFirst({
        where: {
          code: dto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Kode tenor deposito sudah ada');
      }
    }

    return this.prisma.depositTenorOption.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTenorOption(id: string) {
    const option = await this.findTenorOptionById(id);

    const usedCount = await this.prisma.depositApplication.count({
      where: { depositTenorCode: option.code },
    });

    if (usedCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus. Opsi ini digunakan di ${usedCount} pengajuan deposito.`,
      );
    }

    await this.prisma.depositTenorOption.delete({
      where: { id },
    });

    return { message: `Opsi tenor "${option.label}" berhasil dihapus` };
  }

  // GET DEPOSIT CONFIG

  async getDepositConfig() {
    const [amounts, tenors, interestSetting, calculationMethodSetting] = await Promise.all([
      this.findAllActiveAmountOptions(),
      this.findAllActiveTenorOptions(),
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_interest_rate' },
      }),
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_calculation_method' },
      }),
    ]);

    return {
      amounts,
      tenors,
      interestRate: interestSetting ? parseFloat(interestSetting.value) : 6,
      calculationMethod: calculationMethodSetting?.value || 'SIMPLE', // SIMPLE or COMPOUND
    };
  }

  // CALCULATE DEPOSIT RETURN
  
  /**
   * Calculate deposit return based on calculation method
   * 
   * SIMPLE (Bunga Sederhana):
   * Bunga = Pokok × (Suku Bunga Tahunan / 100) × (Tenor dalam bulan / 12)
   * 
   * COMPOUND (Bunga Majemuk - compounding monthly):
   * Total = Pokok × (1 + (Suku Bunga Tahunan / 100) / 12)^Tenor
   * Bunga = Total - Pokok
   */
  calculateDepositReturn(
    principal: number,
    tenorMonths: number,
    annualInterestRate: number,
    calculationMethod: 'SIMPLE' | 'COMPOUND' = 'SIMPLE',
  ) {
    let projectedInterest: number;
    let totalReturn: number;
    let effectiveRate: number;
    let monthlyInterestBreakdown: Array<{
      month: number;
      openingBalance: number;
      interest: number;
      closingBalance: number;
    }> = [];

    if (calculationMethod === 'COMPOUND') {
      // Compound Interest (Bunga Majemuk)
      // Monthly compounding: A = P × (1 + r/12)^n
      const monthlyRate = annualInterestRate / 100 / 12;
      totalReturn = principal * Math.pow(1 + monthlyRate, tenorMonths);
      projectedInterest = totalReturn - principal;
      
      // Calculate effective annual rate
      effectiveRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

      // Generate monthly breakdown for compound
      let balance = principal;
      for (let month = 1; month <= tenorMonths; month++) {
        const monthInterest = balance * monthlyRate;
        const closingBalance = balance + monthInterest;
        monthlyInterestBreakdown.push({
          month,
          openingBalance: Math.round(balance),
          interest: Math.round(monthInterest),
          closingBalance: Math.round(closingBalance),
        });
        balance = closingBalance;
      }
    } else {
      // Simple Interest (Bunga Sederhana)
      // I = P × r × t
      // Where: P = Principal, r = annual rate (decimal), t = time in years
      const timeInYears = tenorMonths / 12;
      projectedInterest = principal * (annualInterestRate / 100) * timeInYears;
      totalReturn = principal + projectedInterest;
      effectiveRate = annualInterestRate;

      // Generate monthly breakdown for simple
      const monthlyInterest = projectedInterest / tenorMonths;
      let balance = principal;
      for (let month = 1; month <= tenorMonths; month++) {
        const closingBalance = balance + monthlyInterest;
        monthlyInterestBreakdown.push({
          month,
          openingBalance: Math.round(balance),
          interest: Math.round(monthlyInterest),
          closingBalance: Math.round(closingBalance),
        });
        balance = closingBalance;
      }
    }

    return {
      principal,
      tenorMonths,
      annualInterestRate,
      calculationMethod,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      projectedInterest: Math.round(projectedInterest),
      totalReturn: Math.round(totalReturn),
      monthlyInterestBreakdown,
    };
  }

  /**
   * Preview calculation for frontend
   */
  async previewCalculation(
    amountCode: string,
    tenorCode: string,
  ) {
    const [amountOption, tenorOption, config] = await Promise.all([
      this.findAmountOptionByCode(amountCode),
      this.findTenorOptionByCode(tenorCode),
      this.getDepositConfig(),
    ]);

    const principal = amountOption.amount.toNumber();
    const tenorMonths = tenorOption.months;

    return this.calculateDepositReturn(
      principal,
      tenorMonths,
      config.interestRate,
      config.calculationMethod as 'SIMPLE' | 'COMPOUND',
    );
  }
}