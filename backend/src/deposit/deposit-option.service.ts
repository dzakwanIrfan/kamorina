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

    // Check if used in any deposit application
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

    // Check if used in any deposit application
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
    const [amounts, tenors, interestSetting] = await Promise.all([
      this.findAllActiveAmountOptions(),
      this.findAllActiveTenorOptions(),
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_interest_rate' },
      }),
    ]);

    return {
      amounts,
      tenors,
      interestRate: interestSetting ? parseFloat(interestSetting.value) : 6,
    };
  }
}