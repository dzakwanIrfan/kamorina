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
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Golongan, Prisma } from '@prisma/client';

@Injectable()
export class GolonganService {
  constructor(private prisma: PrismaService) {}

  async create(createGolonganDto: CreateGolonganDto): Promise<Golongan> {
    const { golonganName, description } = createGolonganDto;

    // Check if golongan already exists
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

    // Build where clause
    const where: Prisma.GolonganWhereInput = {};

    // Search filter (multiple fields)
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

    // Exact golongan name filter
    if (golonganName) {
      where.golonganName = golonganName;
    }

    // Date range filter
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

    // Build orderBy clause
    const orderBy: Prisma.GolonganOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.golongan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { employees: true },
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
          take: 10, // Limit employee list
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!golongan) {
      throw new NotFoundException('Golongan tidak ditemukan');
    }

    return golongan;
  }

  async update(id: string, updateGolonganDto: UpdateGolonganDto): Promise<Golongan> {
    // Check if golongan exists
    await this.findOne(id);

    const { golonganName, description } = updateGolonganDto;

    // Check if new name already exists (exclude current golongan)
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

    // Check if golongan has employees
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
}