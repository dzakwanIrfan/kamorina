// src/departments/departments.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Department, Prisma } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const { departmentName } = createDepartmentDto;

    const existing = await this.prisma.department.findUnique({
      where: { departmentName },
    });

    if (existing) {
      throw new ConflictException('Department dengan nama tersebut sudah ada');
    }

    return this.prisma.department.create({
      data: { departmentName },
    });
  }

  async findAll(query: QueryDepartmentDto): Promise<PaginatedResult<Department>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      departmentName,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DepartmentWhereInput = {};

    // Search filter
    if (search) {
      where.departmentName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Exact department name filter
    if (departmentName) {
      where.departmentName = departmentName;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.DepartmentOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.department.count({ where }),
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

  async findOne(id: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            nik: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    await this.findOne(id);

    const { departmentName } = updateDepartmentDto;

    if (departmentName) {
      const existing = await this.prisma.department.findFirst({
        where: {
          departmentName,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Department dengan nama tersebut sudah ada');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const department = await this.findOne(id);

    const userCount = await this.prisma.user.count({
      where: { departmentId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus department. Masih ada ${userCount} user yang terdaftar di department ini.`,
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    return {
      message: `Department "${department.departmentName}" berhasil dihapus`,
    };
  }
}