import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if employee number already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { employeeNumber: createEmployeeDto.employeeNumber },
    });

    if (existingEmployee) {
      throw new ConflictException('Nomor karyawan sudah terdaftar');
    }

    try {
      const employee = await this.prisma.employee.create({
        data: {
          employeeNumber: createEmployeeDto.employeeNumber,
          fullName: createEmployeeDto.fullName,
          isActive: createEmployeeDto.isActive ?? true,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      return {
        message: 'Karyawan berhasil ditambahkan',
        data: employee,
      };
    } catch (error) {
      console.error('Create employee error:', error);
      throw new BadRequestException('Gagal menambahkan karyawan');
    }
  }

  async findAll(query: QueryEmployeeDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      employeeNumber,
      fullName,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by employee number
    if (employeeNumber) {
      where.employeeNumber = {
        contains: employeeNumber,
        mode: 'insensitive',
      };
    }

    // Filter by full name
    if (fullName) {
      where.fullName = {
        contains: fullName,
        mode: 'insensitive',
      };
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
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

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
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

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            memberVerified: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    // Check if new employee number already exists (if changing)
    if (
      updateEmployeeDto.employeeNumber &&
      updateEmployeeDto.employeeNumber !== employee.employeeNumber
    ) {
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { employeeNumber: updateEmployeeDto.employeeNumber },
      });

      if (existingEmployee) {
        throw new ConflictException('Nomor karyawan sudah terdaftar');
      }
    }

    try {
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      return {
        message: 'Karyawan berhasil diperbarui',
        data: updatedEmployee,
      };
    } catch (error) {
      console.error('Update employee error:', error);
      throw new BadRequestException('Gagal memperbarui karyawan');
    }
  }

  async remove(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    // Check if employee has associated users
    if (employee._count.users > 0) {
      throw new BadRequestException(
        'Tidak dapat menghapus karyawan yang masih memiliki user terkait',
      );
    }

    try {
      await this.prisma.employee.delete({
        where: { id },
      });

      return {
        message: 'Karyawan berhasil dihapus',
      };
    } catch (error) {
      console.error('Delete employee error:', error);
      throw new BadRequestException('Gagal menghapus karyawan');
    }
  }

  async toggleActive(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    try {
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: {
          isActive: !employee.isActive,
        },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      return {
        message: `Karyawan berhasil ${updatedEmployee.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        data: updatedEmployee,
      };
    } catch (error) {
      console.error('Toggle active error:', error);
      throw new BadRequestException('Gagal mengubah status karyawan');
    }
  }
}