import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

interface QueryGolonganDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class GolonganService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryGolonganDto): Promise<PaginatedResult<any>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'golonganName',
        sortOrder = 'asc',
      } = query;

      // Validasi input
      const validatedPage = Math.max(1, Number(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
      const skip = (validatedPage - 1) * validatedLimit;

      const where: any = {};

      // Search - gunakan contains tanpa mode insensitive untuk MySQL compatibility
      if (search && search.trim()) {
        where.OR = [
          { golonganName: { contains: search.trim() } },
          { description: { contains: search.trim() } },
        ];
      }

      // Validasi sortBy untuk mencegah SQL injection
      const allowedSortFields = ['golonganName', 'description', 'createdAt', 'updatedAt'];
      const validatedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'golonganName';
      const validatedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const [golongans, total] = await Promise.all([
        this.prisma.golongan.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { [validatedSortBy]: validatedSortOrder },
          include: {
            _count: {
              select: { employees: true },
            },
          },
        }),
        this.prisma.golongan.count({ where }),
      ]);

      return {
        data: golongans,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
          hasNextPage: validatedPage * validatedLimit < total,
          hasPreviousPage: validatedPage > 1,
        },
      };
    } catch (error) {
      console.error('Error in GolonganService.findAll:', error);
      throw new BadRequestException('Gagal mengambil data golongan');
    }
  }

  async findOne(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('ID golongan tidak valid');
      }

      const golongan = await this.prisma.golongan.findUnique({
        where: { id },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      });

      if (!golongan) {
        throw new NotFoundException('Golongan tidak ditemukan');
      }

      return golongan;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in GolonganService.findOne:', error);
      throw new BadRequestException('Gagal mengambil data golongan');
    }
  }
}