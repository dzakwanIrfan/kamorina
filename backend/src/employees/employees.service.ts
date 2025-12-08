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
import { EmployeeCsvService, EmployeeCSVRow } from './employees-csv.service';
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

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: createEmployeeDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    // Verify golongan exists
    const golongan = await this.prisma.golongan.findUnique({
      where: { id: createEmployeeDto.golonganId },
    });

    if (!golongan) {
      throw new NotFoundException('Golongan tidak ditemukan');
    }

    try {
      const employee = await this.prisma.employee.create({
        data: {
          employeeNumber: createEmployeeDto.employeeNumber,
          fullName: createEmployeeDto.fullName,
          departmentId: createEmployeeDto.departmentId,
          golonganId: createEmployeeDto.golonganId,
          employeeType: createEmployeeDto.employeeType,
          isActive: true,
          permanentEmployeeDate: createEmployeeDto.permanentEmployeeDate,
        },
        include: {
          department: true,
          golongan: true,
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
      departmentId,
      golonganId,
      employeeType,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by active status
    if (isActive !== undefined && isActive !== null) {
      const rawValue: any = isActive;
      let boolValue: boolean;
      
      if (typeof rawValue === 'boolean') {
        boolValue = rawValue;
      } else if (typeof rawValue === 'string') {
        boolValue = rawValue.toLowerCase() === 'true';
      } else {
        boolValue = Boolean(rawValue);
      }
      
      where.isActive = boolValue;
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

    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Filter by golongan
    if (golonganId) {
      where.golonganId = golonganId;
    }

    // Filter by employee type
    if (employeeType) {
      where.employeeType = employeeType;
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { department: { departmentName: { contains: search, mode: 'insensitive' } } },
        { golongan: { golonganName: { contains: search, mode: 'insensitive' } } },
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
          department: true,
          golongan: true,
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
        department: true,
        golongan: true,
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

    // Verify department if provided
    if (updateEmployeeDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateEmployeeDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department tidak ditemukan');
      }
    }

    // Verify golongan if provided
    if (updateEmployeeDto.golonganId) {
      const golongan = await this.prisma.golongan.findUnique({
        where: { id: updateEmployeeDto.golonganId },
      });

      if (!golongan) {
        throw new NotFoundException('Golongan tidak ditemukan');
      }
    }

    try {
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
        include: {
          department: true,
          golongan: true,
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
          department: true,
          golongan: true,
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

  /**
   * Import employees from CSV
   */
  async importFromCSV(csvData: EmployeeCSVRow[], csvService: EmployeeCsvService) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; employeeNumber: string; error: string }>,
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // +2 because index starts at 0 and we skip header

      try {
        const employeeDto = csvService.convertToEmployeeDto(row);

        // Find department by name
        const department = await this.prisma.department.findFirst({
          where: {
            departmentName: {
              equals: employeeDto.departmentName,
              mode: 'insensitive',
            },
          },
        });

        if (!department) {
          throw new Error(`Department "${employeeDto.departmentName}" tidak ditemukan`);
        }

        // Find golongan by name
        const golongan = await this.prisma.golongan.findFirst({
          where: {
            golonganName: {
              equals: employeeDto.golonganName,
              mode: 'insensitive',
            },
          },
        });

        if (!golongan) {
          throw new Error(`Golongan "${employeeDto.golonganName}" tidak ditemukan`);
        }

        // Check if employee already exists
        const existingEmployee = await this.prisma.employee.findUnique({
          where: { employeeNumber: employeeDto.employeeNumber },
        });

        if (existingEmployee) {
          // Update existing employee
          await this.prisma.employee.update({
            where: { employeeNumber: employeeDto.employeeNumber },
            data: {
              fullName: employeeDto.fullName,
              departmentId: department.id,
              golonganId: golongan.id,
              employeeType: employeeDto.employeeType as any,
              isActive: employeeDto.isActive,
            },
          });
        } else {
          // Create new employee
          await this.prisma.employee.create({
            data: {
              employeeNumber: employeeDto.employeeNumber,
              fullName: employeeDto.fullName,
              departmentId: department.id,
              golonganId: golongan.id,
              employeeType: employeeDto.employeeType as any,
              isActive: employeeDto.isActive,
            },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          employeeNumber: row.employeeNumber,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}