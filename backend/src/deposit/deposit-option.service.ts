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
        isActive: dto.isActive ??  true,
        sortOrder: dto.sortOrder ??  0,
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
      this.prisma. depositAmountOption.findMany({
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

    if (! option) {
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
        `Tidak dapat menghapus.  Opsi ini digunakan di ${usedCount} pengajuan deposito. `,
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
        sortOrder: dto. sortOrder ?? 0,
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

    const where: Prisma. DepositTenorOptionWhereInput = {};

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
      this. prisma.depositTenorOption.findMany({
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
    const option = await this.prisma. depositTenorOption.findUnique({
      where: { id },
    });

    if (! option) {
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

    const usedCount = await this. prisma.depositApplication.count({
      where: { depositTenorCode: option.code },
    });

    if (usedCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus. Opsi ini digunakan di ${usedCount} pengajuan deposito.`,
      );
    }

    await this. prisma.depositTenorOption.delete({
      where: { id },
    });

    return { message: `Opsi tenor "${option.label}" berhasil dihapus` };
  }

  // GET DEPOSIT CONFIG

  async getDepositConfig() {
    const [amounts, tenors, interestSetting, calculationMethodSetting] = await Promise.all([
      this.findAllActiveAmountOptions(),
      this. findAllActiveTenorOptions(),
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
      interestRate: interestSetting ?  parseFloat(interestSetting.value) : 6,
      calculationMethod: calculationMethodSetting?. value || 'SIMPLE',
    };
  }

  // CALCULATE DEPOSIT RETURN
  
  /**
   * Calculate deposit return for MONTHLY INSTALLMENT savings (Tabungan Berjangka)
   * 
   * Ini adalah TABUNGAN BERJANGKA dengan setoran bulanan, bukan deposito lump sum! 
   * 
   * Konsep:
   * - User memilih jumlah setoran per bulan (misal 200rb, 500rb, 1jt, dst)
   * - Tenor adalah berapa bulan user akan menabung (3, 6, 9, 12 bulan)
   * - Setiap bulan dipotong dari gaji sesuai jumlah yang dipilih
   * - Bunga dihitung dari akumulasi tabungan
   * 
   * Metode Perhitungan:
   * 
   * 1.  SIMPLE INTEREST (Bunga Sederhana):
   *    - Bunga dihitung berdasarkan saldo rata-rata
   *    - Saldo Rata-rata = (Setoran × Tenor × (Tenor + 1)) / (2 × Tenor)
   *    - Bunga = Saldo Rata-rata × Rate × (Tenor/12)
   * 
   * 2.  COMPOUND INTEREST (Bunga Majemuk - Monthly Compounding):
   *    - Setiap setoran bulanan mendapat bunga sejak bulan masuk
   *    - Setoran bulan pertama dapat bunga selama (tenor) bulan
   *    - Setoran bulan kedua dapat bunga selama (tenor-1) bulan, dst
   *    - Menggunakan Future Value of Annuity formula
   */
  calculateDepositReturn(
    monthlyDeposit: number,        // Setoran per bulan (amount yang dipilih user)
    tenorMonths: number,            // Berapa bulan menabung
    annualInterestRate: number,     // Bunga tahunan (%)
    calculationMethod: 'SIMPLE' | 'COMPOUND' = 'SIMPLE',
  ) {
    const totalPrincipal = monthlyDeposit * tenorMonths; // Total uang yang disetor
    let projectedInterest: number;
    let totalReturn: number;
    let effectiveRate: number;
    let monthlyInterestBreakdown: Array<{
      month: number;
      monthlyDeposit: number;
      depositAccumulation: number;
      interestAccumulation: number;
      totalBalance: number;
    }> = [];

    if (calculationMethod === 'COMPOUND') {
      // COMPOUND INTEREST - Future Value of Annuity (FV Anuitas)
      // FV = PMT × [((1 + r)^n - 1) / r]
      // Dimana bunga compound monthly
      
      const monthlyRate = annualInterestRate / 100 / 12;
      let depositBalance = 0;
      let interestBalance = 0;

      // Hitung bunga untuk setiap setoran
      for (let month = 1; month <= tenorMonths; month++) {
        // Tambah setoran bulan ini
        depositBalance += monthlyDeposit;
        
        // Hitung bunga untuk seluruh saldo (deposit + interest sebelumnya)
        const thisMonthInterest = (depositBalance + interestBalance) * monthlyRate;
        interestBalance += thisMonthInterest;

        monthlyInterestBreakdown.push({
          month,
          monthlyDeposit,
          depositAccumulation: Math.round(depositBalance),
          interestAccumulation: Math.round(interestBalance),
          totalBalance: Math.round(depositBalance + interestBalance),
        });
      }

      projectedInterest = interestBalance;
      totalReturn = depositBalance + interestBalance;
      
      // Effective annual rate
      effectiveRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

    } else {
      // SIMPLE INTEREST - Berdasarkan saldo rata-rata
      // Formula saldo rata-rata untuk setoran bulanan:
      // Avg Balance = (Monthly Deposit × Tenor × (Tenor + 1)) / (2 × Tenor)
      // 
      // Contoh: Setoran 3jt/bulan selama 12 bulan
      // Bulan 1: saldo = 3jt
      // Bulan 2: saldo = 6jt
      // ... 
      // Bulan 12: saldo = 36jt
      // Rata-rata = (3jt × 12 × 13) / (2 × 12) = 19. 5jt
      
      const averageBalance = (monthlyDeposit * tenorMonths * (tenorMonths + 1)) / (2 * tenorMonths);
      const timeInYears = tenorMonths / 12;
      
      // Bunga = Saldo Rata-rata × Rate × Time
      projectedInterest = averageBalance * (annualInterestRate / 100) * timeInYears;
      totalReturn = totalPrincipal + projectedInterest;
      effectiveRate = annualInterestRate;

      // Generate monthly breakdown
      let depositBalance = 0;
      const monthlyInterest = projectedInterest / tenorMonths; // Bagi rata bunga ke setiap bulan
      let interestBalance = 0;

      for (let month = 1; month <= tenorMonths; month++) {
        depositBalance += monthlyDeposit;
        interestBalance += monthlyInterest;

        monthlyInterestBreakdown.push({
          month,
          monthlyDeposit,
          depositAccumulation: Math. round(depositBalance),
          interestAccumulation: Math.round(interestBalance),
          totalBalance: Math.round(depositBalance + interestBalance),
        });
      }
    }

    return {
      monthlyDeposit,                                      // Setoran per bulan
      tenorMonths,                                         // Jangka waktu (bulan)
      totalPrincipal,                                      // Total setoran (deposit × tenor)
      annualInterestRate,                                  // Bunga tahunan
      calculationMethod,                                   // Metode hitung
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      projectedInterest: Math.round(projectedInterest),    // Total bunga yang didapat
      totalReturn: Math. round(totalReturn),                // Total uang yang diterima
      monthlyInterestBreakdown,                            // Rincian per bulan
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

    const monthlyDeposit = amountOption.amount. toNumber();
    const tenorMonths = tenorOption.months;

    return this.calculateDepositReturn(
      monthlyDeposit,
      tenorMonths,
      config.interestRate,
      config.calculationMethod as 'SIMPLE' | 'COMPOUND',
    );
  }
}