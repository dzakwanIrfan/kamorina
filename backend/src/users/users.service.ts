import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { newEmployee, roles, password, employeeId, ...userData } =
      createUserDto;

    // Check if email exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    if (userData.nik) {
      const existingNik = await this.prisma.user.findUnique({
        where: { nik: userData.nik },
      });
      if (existingNik) {
        throw new ConflictException('NIK sudah terdaftar');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    return this.prisma.$transaction(async (tx) => {
      let finalEmployeeId = employeeId;

      // Handle new employee creation
      if (newEmployee) {
        // Validation for new employee
        const existingEmp = await tx.employee.findUnique({
          where: { employeeNumber: newEmployee.employeeNumber },
        });
        if (existingEmp) {
          throw new ConflictException('Nomor karyawan sudah terdaftar');
        }

        const dept = await tx.department.findUnique({
          where: { id: newEmployee.departmentId },
        });
        if (!dept) throw new BadRequestException('Department tidak valid');

        const gol = await tx.golongan.findUnique({
          where: { id: newEmployee.golonganId },
        });
        if (!gol) throw new BadRequestException('Golongan tidak valid');

        const createdEmployee = await tx.employee.create({
          data: {
            employeeNumber: newEmployee.employeeNumber,
            fullName: newEmployee.fullName,
            departmentId: newEmployee.departmentId,
            golonganId: newEmployee.golonganId,
            employeeType: newEmployee.employeeType,
            isActive: true, // Default active
            permanentEmployeeDate: newEmployee.permanentEmployeeDate,
            bankAccountNumber: newEmployee.bankAccountNumber,
            bankAccountName: newEmployee.bankAccountName,
          },
        });
        finalEmployeeId = createdEmployee.id;
      }

      if (!finalEmployeeId) {
        throw new BadRequestException(
          'Employee ID atau Data Karyawan Baru wajib diisi',
        );
      }

      // Check if employee is already linked
      const existingUserEmp = await tx.user.findUnique({
        where: { employeeId: finalEmployeeId },
      });
      if (existingUserEmp) {
        throw new ConflictException(
          'Employee ini sudah terhubung dengan user lain',
        );
      }

      // Create User
      const user = await tx.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          employeeId: finalEmployeeId,
          emailVerified: userData.emailVerified ?? true, // Admin created users are verified by default
        },
      });

      // Assign Roles
      if (roles && roles.length > 0) {
        for (const roleName of roles) {
          let level = await tx.level.findUnique({
            where: { levelName: roleName },
          });
          if (!level) {
            continue;
          }
          await tx.userRole.create({
            data: {
              userId: user.id,
              levelId: level.id,
            },
          });
        }
      } else {
        // Default to Anggota
        const defaultRole = await tx.level.findUnique({
          where: { levelName: 'anggota' },
        });
        if (defaultRole) {
          await tx.userRole.create({
            data: { userId: user.id, levelId: defaultRole.id },
          });
        }
      }

      return user;
    });
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
      departmentId,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        {
          employee: {
            employeeNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (role) {
      where.roles = {
        some: {
          level: {
            levelName: role,
          },
        },
      };
    }

    if (departmentId) {
      where.employee = {
        departmentId: departmentId,
      };
    }

    if (isActive !== undefined) {
      const boolActive = isActive === 'true';
      const currentEmployeeWhere =
        (where.employee as Prisma.EmployeeWhereInput) || {};

      where.employee = {
        ...currentEmployeeWhere,
        isActive: boolActive,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          roles: {
            include: {
              level: true,
            },
          },
          employee: {
            include: {
              department: true,
              golongan: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { level: true },
        },
        employee: {
          include: {
            department: true,
            golongan: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { employeeUpdates, roles, password, ...userData } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update basic user info
      const updateData: any = { ...userData };
      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Update employee info if requested
      if (employeeUpdates && user.employeeId) {
        // Only update allowed fields from UpdateEmployeeDto
        // We reuse logic or just direct update

        // Simple basic validation if specific fields change
        if (employeeUpdates.departmentId) {
          const dept = await tx.department.findUnique({
            where: { id: employeeUpdates.departmentId },
          });
          if (!dept) throw new BadRequestException('Department invalid');
        }
        if (employeeUpdates.golonganId) {
          const gol = await tx.golongan.findUnique({
            where: { id: employeeUpdates.golonganId },
          });
          if (!gol) throw new BadRequestException('Golongan invalid');
        }

        await tx.employee.update({
          where: { id: user.employeeId },
          data: {
            ...employeeUpdates,
          },
        });
      }

      // Update Roles if requested
      if (roles) {
        // Remove all existing roles
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        for (const roleName of roles) {
          const level = await tx.level.findFirst({
            where: { levelName: roleName },
          });
          if (level) {
            await tx.userRole.create({
              data: {
                userId: id,
                levelId: level.id,
              },
            });
          }
        }
      }

      return this.findOne(id); // Return full object with relations
    });
  }

  async remove(id: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
