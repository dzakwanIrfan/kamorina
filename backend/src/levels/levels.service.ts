import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { QueryLevelDto } from './dto/query-level.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import { Level, Prisma, User } from '@prisma/client';

@Injectable()
export class LevelsService {
  constructor(private prisma: PrismaService) {}

  async create(createLevelDto: CreateLevelDto): Promise<Level> {
    const { levelName, description } = createLevelDto;

    // Check if level already exists
    const existing = await this.prisma.level.findUnique({
      where: { levelName },
    });

    if (existing) {
      throw new ConflictException('Level dengan nama tersebut sudah ada');
    }

    return this.prisma.level.create({
      data: {
        levelName,
        description,
      },
    });
  }

  async findAll(query: QueryLevelDto): Promise<PaginatedResult<Level>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      levelName,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.LevelWhereInput = {};

    // Search filter (multiple fields)
    if (search) {
      where.OR = [
        {
          levelName: {
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

    // Exact level name filter
    if (levelName) {
      where.levelName = levelName;
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
    const orderBy: Prisma.LevelOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.level.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { userRoles: true },
          },
        },
      }),
      this.prisma.level.count({ where }),
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

  async findOne(id: string): Promise<Level> {
    const level = await this.prisma.level.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nik: true,
              },
            },
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!level) {
      throw new NotFoundException('Level tidak ditemukan');
    }

    return level;
  }

  async update(id: string, updateLevelDto: UpdateLevelDto): Promise<Level> {
    // Check if level exists
    await this.findOne(id);

    const { levelName, description } = updateLevelDto;

    // Check if new name already exists (exclude current level)
    if (levelName) {
      const existing = await this.prisma.level.findFirst({
        where: {
          levelName,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Level dengan nama tersebut sudah ada');
      }
    }

    return this.prisma.level.update({
      where: { id },
      data: {
        ...(levelName && { levelName }),
        ...(description !== undefined && { description }),
      },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const level = await this.findOne(id);

    // Prevent deleting default "anggota" level
    if (level.levelName === 'anggota') {
      throw new BadRequestException(
        'Level "anggota" tidak dapat dihapus karena merupakan level default',
      );
    }

    // Check if level has users
    const userRoleCount = await this.prisma.userRole.count({
      where: { levelId: id },
    });

    if (userRoleCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus level. Masih ada ${userRoleCount} user yang memiliki level ini.`,
      );
    }

    await this.prisma.level.delete({
      where: { id },
    });

    return {
      message: `Level "${level.levelName}" berhasil dihapus`,
    };
  }

  async assignUser(
    id: string,
    assignUserDto: AssignUserDto,
  ): Promise<{ message: string }> {
    const { userId } = assignUserDto;

    // Check if level exists
    const level = await this.findOne(id);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_levelId: {
          userId,
          levelId: id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User sudah memiliki level ini');
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        levelId: id,
      },
    });

    return {
      message: `User "${user.name}" berhasil ditambahkan ke level "${level.levelName}"`,
    };
  }

  async removeUser(id: string, userId: string): Promise<{ message: string }> {
    // Check if level exists
    const level = await this.findOne(id);

    // Check if assignment exists
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_levelId: {
          userId,
          levelId: id,
        },
      },
      include: {
        user: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User tidak memiliki level ini');
    }

    // Prevent removing 'ketua' role if it's the last one, maybe?
    // For now, let's just allow removal unless it breaks something critical.
    // Ideally we should check if this is the last super admin but let's stick to basic requirement first.

    await this.prisma.userRole.delete({
      where: {
        userId_levelId: {
          userId,
          levelId: id,
        },
      },
    });

    return {
      message: `User "${userRole.user.name}" berhasil dihapus dari level "${level.levelName}"`,
    };
  }
}
