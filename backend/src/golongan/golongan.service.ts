import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGolonganDto } from './dto/create-golongan.dto';
import { UpdateGolonganDto } from './dto/update-golongan.dto';
import { QueryGolonganDto } from './dto/query-golongan.dto';
import { CreateLoanLimitDto } from './dto/create-loan-limit.dto';
import { UpdateLoanLimitDto } from './dto/update-loan-limit.dto';
import { BulkUpdateLoanLimitsDto } from './dto/bulk-update-loan-limits.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Golongan, Prisma } from '@prisma/client';

@Injectable()
export class GolonganService {
  constructor(private prisma: PrismaService) {}

  async create(createGolonganDto: CreateGolonganDto): Promise<Golongan> {
    const { golonganName, description } = createGolonganDto;

    const existing = await this.prisma.golongan.findUnique({
      where: { golonganName },
    });

    if (existing) {
      throw new ConflictException('Golongan dengan nama tersebut sudah ada');
    }

    return this.prisma.golongan.create({
      data: {
        golonganName,
        description,
      },
    });
  }

  async findAll(query: QueryGolonganDto): Promise<PaginatedResult<Golongan>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'golonganName',
      sortOrder = 'asc',
      startDate,
      endDate,
      golonganName,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.GolonganWhereInput = {};

    if (search) {
      where.OR = [
        {
          golonganName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (golonganName) {
      where.golonganName = golonganName;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const orderBy: Prisma.GolonganOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.golongan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { 
              employees: true,
              loanLimits: true,
            },
          },
        },
      }),
      this.prisma.golongan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Golongan> {
    const golongan = await this.prisma.golongan.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeNumber: true,
            fullName: true,
            employeeType: true,
            isActive: true,
          },
          take: 10,
        },
        loanLimits: {
          orderBy: {
            minYearsOfService: 'asc',
          },
        },
        _count: {
          select: { 
            employees: true,
            loanLimits: true,
          },
        },
      },
    });

    if (!golongan) {
      throw new NotFoundException('Golongan tidak ditemukan');
    }

    return golongan;
  }

  async update(id: string, updateGolonganDto: UpdateGolonganDto): Promise<Golongan> {
    await this.findOne(id);

    const { golonganName, description } = updateGolonganDto;

    if (golonganName) {
      const existing = await this.prisma.golongan.findFirst({
        where: {
          golonganName,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Golongan dengan nama tersebut sudah ada');
      }
    }

    return this.prisma.golongan.update({
      where: { id },
      data: {
        ...(golonganName && { golonganName }),
        ...(description !== undefined && { description }),
      },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const golongan = await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({
      where: { golonganId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus golongan. Masih ada ${employeeCount} karyawan yang memiliki golongan ini.`,
      );
    }

    await this.prisma.golongan.delete({
      where: { id },
    });

    return {
      message: `Golongan "${golongan.golonganName}" berhasil dihapus`,
    };
  }

  // LOAN LIMIT MATRIX

  async createLoanLimit(createLoanLimitDto: CreateLoanLimitDto) {
    const { golonganId, minYearsOfService, maxYearsOfService, maxLoanAmount } = createLoanLimitDto;

    // Verify golongan exists
    await this.findOne(golonganId);

    // Check for overlapping ranges
    const existing = await this.prisma.loanLimitMatrix.findFirst({
      where: {
        golonganId,
        minYearsOfService,
        maxYearsOfService,
      },
    });

    if (existing) {
      throw new ConflictException('Plafond untuk range masa kerja ini sudah ada');
    }

    return this.prisma.loanLimitMatrix.create({
      data: {
        golonganId,
        minYearsOfService,
        maxYearsOfService,
        maxLoanAmount,
      },
    });
  }

  async bulkUpdateLoanLimits(bulkUpdateDto: BulkUpdateLoanLimitsDto) {
    const { golonganId, limits } = bulkUpdateDto;

    // Verify golongan exists
    await this.findOne(golonganId);

    // Delete existing limits for this golongan
    await this.prisma.loanLimitMatrix.deleteMany({
      where: { golonganId },
    });

    // Create new limits
    const createPromises = limits.map((limit) => {
      const minYears = parseInt(limit.minYearsOfService);
      const maxYears = limit.maxYearsOfService === 'null' ? null : parseInt(limit.maxYearsOfService);
      const amount = parseFloat(limit.maxLoanAmount);

      return this.prisma.loanLimitMatrix.create({
        data: {
          golonganId,
          minYearsOfService: minYears,
          maxYearsOfService: maxYears,
          maxLoanAmount: amount,
        },
      });
    });

    await Promise.all(createPromises);

    return {
      message: 'Plafond pinjaman berhasil diupdate',
      count: limits.length,
    };
  }

  async getLoanLimitsByGolongan(golonganId: string) {
    await this.findOne(golonganId);

    return this.prisma.loanLimitMatrix.findMany({
      where: { golonganId },
      orderBy: {
        minYearsOfService: 'asc',
      },
      include: {
        golongan: {
          select: {
            id: true,
            golonganName: true,
          },
        },
      },
    });
  }

  async updateLoanLimit(id: string, updateLoanLimitDto: UpdateLoanLimitDto) {
    const existing = await this.prisma.loanLimitMatrix.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plafond tidak ditemukan');
    }

    return this.prisma.loanLimitMatrix.update({
      where: { id },
      data: updateLoanLimitDto,
    });
  }

  async deleteLoanLimit(id: string) {
    const existing = await this.prisma.loanLimitMatrix.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plafond tidak ditemukan');
    }

    await this.prisma.loanLimitMatrix.delete({
      where: { id },
    });

    return {
      message: 'Plafond berhasil dihapus',
    };
  }

  // Helper method to get max loan amount for a user
  async getMaxLoanAmountForUser(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            golongan: true,
          },
        },
      },
    });

    if (!user || !user.employee) {
      throw new NotFoundException('User atau employee tidak ditemukan');
    }

    if (!user.permanentEmployeeDate) {
      throw new BadRequestException('Tanggal karyawan tetap belum diset');
    }

    // Calculate years of service
    const now = new Date();
    const permanentDate = new Date(user.permanentEmployeeDate);
    const yearsDiff = now.getFullYear() - permanentDate.getFullYear();
    const monthsDiff = now.getMonth() - permanentDate.getMonth();
    const yearsOfService = monthsDiff < 0 ? yearsDiff - 1 : yearsDiff;

    // Find matching loan limit
    const loanLimit = await this.prisma.loanLimitMatrix.findFirst({
      where: {
        golonganId: user.employee.golonganId,
        minYearsOfService: {
          lte: yearsOfService,
        },
        OR: [
          {
            maxYearsOfService: {
              gte: yearsOfService,
            },
          },
          {
            maxYearsOfService: null, // For > 9 years
          },
        ],
      },
    });

    if (!loanLimit) {
      return 0;
    }

    return Number(loanLimit.maxLoanAmount);
  }
}