// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ApproveMemberDto } from './dto/approve-member.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, nik, password, departmentId, ...rest } = createUserDto;

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Check if NIK already exists (if provided)
    if (nik) {
      const existingNik = await this.prisma.user.findUnique({
        where: { nik },
      });

      if (existingNik) {
        throw new ConflictException('NIK sudah terdaftar');
      }
    }

    // Validate department if provided
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department tidak ditemukan');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with default role "anggota"
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          nik,
          password: hashedPassword,
          departmentId,
          ...rest,
          emailVerified: true, // Auto verify for admin-created users
          emailVerifiedAt: new Date(),
        },
      });

      // Get "anggota" level
      let anggotaLevel = await tx.level.findFirst({
        where: { levelName: 'anggota' },
      });

      if (!anggotaLevel) {
        anggotaLevel = await tx.level.create({
          data: {
            levelName: 'anggota',
            description: 'Member/Anggota koperasi',
          },
        });
      }

      // Assign default role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          levelId: anggotaLevel.id,
        },
      });

      return newUser;
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      email,
      nik,
      departmentId,
      levelName,
      emailVerified,
      memberVerified,
      birthDateStart,
      birthDateEnd,
      permanentEmployeeDateStart,
      permanentEmployeeDateEnd,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Search filter (multiple fields)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          nik: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Exact filters
    if (email) {
      where.email = email;
    }

    if (nik) {
      where.nik = nik;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Boolean filters
    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    if (memberVerified !== undefined) {
      where.memberVerified = memberVerified;
    }

    // Filter by role/level
    if (levelName) {
      where.roles = {
        some: {
          level: {
            levelName,
          },
        },
      };
    }

    // Date range filter for createdAt
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

    // Date range filter for dateOfBirth
    if (birthDateStart || birthDateEnd) {
      where.dateOfBirth = {};
      if (birthDateStart) {
        where.dateOfBirth.gte = new Date(birthDateStart);
      }
      if (birthDateEnd) {
        where.dateOfBirth.lte = new Date(birthDateEnd);
      }
    }

    // Date range filter for permanentEmployeeDate
    if (permanentEmployeeDateStart || permanentEmployeeDateEnd) {
      where.permanentEmployeeDate = {};
      if (permanentEmployeeDateStart) {
        where.permanentEmployeeDate.gte = new Date(permanentEmployeeDateStart);
      }
      if (permanentEmployeeDateEnd) {
        where.permanentEmployeeDate.lte = new Date(permanentEmployeeDateEnd);
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'department') {
      orderBy.department = { departmentName: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Execute query with pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          nik: true,
          emailVerified: true,
          emailVerifiedAt: true,
          memberVerified: true,
          memberVerifiedAt: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
          dateOfBirth: true,
          birthPlace: true,
          permanentEmployeeDate: true,
          installmentPlan: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              level: {
                select: {
                  id: true,
                  levelName: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform data to include roles as array
    const data = users.map((user) => ({
      ...user,
      roles: user.roles.map((r) => r.level),
    }));

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

  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        nik: true,
        emailVerified: true,
        emailVerifiedAt: true,
        memberVerified: true,
        memberVerifiedAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            departmentName: true,
          },
        },
        dateOfBirth: true,
        birthPlace: true,
        permanentEmployeeDate: true,
        installmentPlan: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            level: {
              select: {
                id: true,
                levelName: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      ...user,
      roles: user.roles.map((r) => r.level),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    await this.findOne(id);

    const { nik, departmentId, ...rest } = updateUserDto;

    // Check if NIK already exists (if changing)
    if (nik) {
      const existingNik = await this.prisma.user.findFirst({
        where: {
          nik,
          NOT: { id },
        },
      });

      if (existingNik) {
        throw new ConflictException('NIK sudah terdaftar');
      }
    }

    // Validate department if provided
    if (departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department tidak ditemukan');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        nik,
        departmentId,
        ...rest,
      },
      select: {
        id: true,
        name: true,
        email: true,
        nik: true,
        emailVerified: true,
        memberVerified: true,
        departmentId: true,
        department: true,
        dateOfBirth: true,
        birthPlace: true,
        permanentEmployeeDate: true,
        installmentPlan: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    // Prevent deleting self (optional, implement if needed)
    // Can be implemented by passing current user ID from controller

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: `User "${user.name}" berhasil dihapus`,
    };
  }

  async assignRoles(id: string, assignRoleDto: AssignRoleDto): Promise<any> {
    await this.findOne(id);

    const { levelIds } = assignRoleDto;

    // Validate all level IDs
    const levels = await this.prisma.level.findMany({
      where: {
        id: {
          in: levelIds,
        },
      },
    });

    if (levels.length !== levelIds.length) {
      throw new BadRequestException('Beberapa level tidak valid');
    }

    // Remove existing roles and assign new ones
    await this.prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new roles
      await tx.userRole.createMany({
        data: levelIds.map((levelId) => ({
          userId: id,
          levelId,
        })),
      });
    });

    return this.findOne(id);
  }

  async approveMember(id: string, approveMemberDto: ApproveMemberDto): Promise<any> {
    const user = await this.findOne(id);

    const { approve, notes } = approveMemberDto;

    // Check if user has completed required information
    if (approve) {
      if (
        !user.departmentId ||
        !user.dateOfBirth ||
        !user.permanentEmployeeDate ||
        !user.installmentPlan
      ) {
        throw new BadRequestException(
          'User belum melengkapi informasi yang diperlukan (department, tanggal lahir, tanggal karyawan tetap, angsuran)',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        memberVerified: approve,
        memberVerifiedAt: approve ? new Date() : null,
      },
    });

    return {
      message: approve
        ? `Member ${user.name} berhasil diapprove`
        : `Member ${user.name} ditolak`,
      user: await this.findOne(id),
      notes,
    };
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = updatePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi tidak cocok');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password saat ini salah');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Password berhasil diubah',
    };
  }
}