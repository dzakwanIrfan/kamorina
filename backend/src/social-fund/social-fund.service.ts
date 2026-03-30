import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocialFundTransactionType, Prisma } from '@prisma/client';
import {
  CreateInitialBalanceDto,
  UpdateInitialBalanceDto,
  CreateSantunanDto,
  QuerySocialFundDto,
} from './dto';

@Injectable()
export class SocialFundService {
  constructor(private prisma: PrismaService) {}

  // Balance

  async getBalance() {
    const balance = await this.getOrCreateBalance();
    return { currentBalance: balance.currentBalance };
  }

  // Initial Balance CRUD

  async getInitialBalances(query: QuerySocialFundDto) {
    const { page = 1, limit = 10, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SocialFundTransactionWhereInput = {
      type: SocialFundTransactionType.INITIAL_BALANCE,
    };

    const [data, total] = await Promise.all([
      this.prisma.socialFundTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.socialFundTransaction.count({ where }),
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

  async createInitialBalance(dto: CreateInitialBalanceDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const balance = await this.getOrCreateBalance(tx);

      const newBalance = balance.currentBalance.add(
        new Prisma.Decimal(dto.amount),
      );

      await tx.socialFundBalance.update({
        where: { id: balance.id },
        data: { currentBalance: newBalance, updatedBy: userId },
      });

      const transaction = await tx.socialFundTransaction.create({
        data: {
          type: SocialFundTransactionType.INITIAL_BALANCE,
          amount: dto.amount,
          balanceAfter: newBalance,
          description: dto.description || 'Saldo Awal Dana Sosial',
          createdBy: userId,
        },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return { message: 'Saldo awal berhasil ditambahkan', data: transaction };
    });
  }

  async updateInitialBalance(
    id: string,
    dto: UpdateInitialBalanceDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.socialFundTransaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Transaksi saldo awal tidak ditemukan');
      }

      if (existing.type !== SocialFundTransactionType.INITIAL_BALANCE) {
        throw new BadRequestException(
          'Transaksi ini bukan bertipe saldo awal',
        );
      }

      const balance = await this.getOrCreateBalance(tx);

      // Calculate new balance: revert old amount, apply new amount
      const oldAmount = existing.amount;
      const newAmount = new Prisma.Decimal(dto.amount ?? oldAmount.toNumber());
      const diff = newAmount.sub(oldAmount);
      const newBalance = balance.currentBalance.add(diff);

      if (newBalance.lessThan(0)) {
        throw new BadRequestException(
          'Perubahan ini akan membuat saldo dana sosial menjadi negatif',
        );
      }

      await tx.socialFundBalance.update({
        where: { id: balance.id },
        data: { currentBalance: newBalance, updatedBy: userId },
      });

      // Update the transaction record and recalculate balanceAfter for subsequent records
      const updated = await tx.socialFundTransaction.update({
        where: { id },
        data: {
          amount: newAmount,
          balanceAfter: existing.balanceAfter.add(diff),
          description: dto.description ?? existing.description,
        },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Recalculate balanceAfter for all transactions after this one
      await this.recalculateBalancesAfter(tx, existing.createdAt);

      return { message: 'Saldo awal berhasil diperbarui', data: updated };
    });
  }

  async deleteInitialBalance(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.socialFundTransaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Transaksi saldo awal tidak ditemukan');
      }

      if (existing.type !== SocialFundTransactionType.INITIAL_BALANCE) {
        throw new BadRequestException(
          'Transaksi ini bukan bertipe saldo awal',
        );
      }

      const balance = await this.getOrCreateBalance(tx);
      const newBalance = balance.currentBalance.sub(existing.amount);

      if (newBalance.lessThan(0)) {
        throw new BadRequestException(
          'Penghapusan ini akan membuat saldo dana sosial menjadi negatif',
        );
      }

      await tx.socialFundBalance.update({
        where: { id: balance.id },
        data: { currentBalance: newBalance, updatedBy: userId },
      });

      await tx.socialFundTransaction.delete({ where: { id } });

      // Recalculate balanceAfter for all transactions after this one
      await this.recalculateBalancesAfter(tx, existing.createdAt);

      return { message: 'Saldo awal berhasil dihapus' };
    });
  }

  // Santunan

  async getSantunanList(query: QuerySocialFundDto) {
    const {
      page = 1,
      limit = 10,
      sortOrder = 'desc',
      search,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SocialFundTransactionWhereInput = {
      type: SocialFundTransactionType.SANTUNAN,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          recipientUser: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          recipientUser: {
            employee: {
              employeeNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.socialFundTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          recipientUser: {
            select: {
              id: true,
              name: true,
              nik: true,
              employee: {
                select: {
                  employeeNumber: true,
                  fullName: true,
                  department: { select: { departmentName: true } },
                },
              },
            },
          },
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.socialFundTransaction.count({ where }),
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

  async createSantunan(dto: CreateSantunanDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check balance sufficiency
      const balance = await this.getOrCreateBalance(tx);
      const deductAmount = new Prisma.Decimal(dto.amount);

      if (balance.currentBalance.lessThan(deductAmount)) {
        throw new BadRequestException(
          `Saldo dana sosial tidak mencukupi. Saldo saat ini: Rp ${balance.currentBalance.toNumber().toLocaleString('id-ID')}`,
        );
      }

      if (balance.currentBalance.equals(0)) {
        throw new BadRequestException('Saldo dana sosial saat ini kosong');
      }

      // 2. Validate recipient eligibility: Karyawan Tetap & Aktif & Verified
      const recipient = await tx.user.findUnique({
        where: { id: dto.recipientUserId },
        include: { employee: true },
      });

      if (!recipient) {
        throw new NotFoundException('Anggota penerima tidak ditemukan');
      }

      if (!recipient.memberVerified) {
        throw new BadRequestException(
          'Anggota penerima belum terverifikasi sebagai anggota koperasi',
        );
      }

      if (!recipient.employee) {
        throw new BadRequestException(
          'Data karyawan penerima tidak ditemukan',
        );
      }

      if (recipient.employee.employeeType !== 'TETAP') {
        throw new BadRequestException(
          'Hanya karyawan tetap yang berhak menerima santunan',
        );
      }

      if (!recipient.employee.isActive) {
        throw new BadRequestException(
          'Hanya karyawan aktif yang berhak menerima santunan',
        );
      }

      // 3. Deduct balance and create transaction atomically
      const newBalance = balance.currentBalance.sub(deductAmount);

      await tx.socialFundBalance.update({
        where: { id: balance.id },
        data: { currentBalance: newBalance, updatedBy: userId },
      });

      const transaction = await tx.socialFundTransaction.create({
        data: {
          type: SocialFundTransactionType.SANTUNAN,
          amount: deductAmount,
          balanceAfter: newBalance,
          description: dto.description,
          recipientUserId: dto.recipientUserId,
          createdBy: userId,
        },
        include: {
          recipientUser: {
            select: {
              id: true,
              name: true,
              nik: true,
              employee: {
                select: {
                  employeeNumber: true,
                  fullName: true,
                  department: { select: { departmentName: true } },
                },
              },
            },
          },
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return { message: 'Santunan berhasil dibuat', data: transaction };
    });
  }

  async deleteSantunan(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.socialFundTransaction.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Transaksi santunan tidak ditemukan');
      }

      if (existing.type !== SocialFundTransactionType.SANTUNAN) {
        throw new BadRequestException('Transaksi ini bukan bertipe santunan');
      }

      // Reverse: restore the deducted amount
      const balance = await this.getOrCreateBalance(tx);
      const newBalance = balance.currentBalance.add(existing.amount);

      await tx.socialFundBalance.update({
        where: { id: balance.id },
        data: { currentBalance: newBalance, updatedBy: userId },
      });

      await tx.socialFundTransaction.delete({ where: { id } });

      await this.recalculateBalancesAfter(tx, existing.createdAt);

      return { message: 'Santunan berhasil dihapus (saldo dikembalikan)' };
    });
  }

  // Eligible Members

  async getEligibleMembers(search?: string) {
    const where: Prisma.UserWhereInput = {
      memberVerified: true,
      employee: {
        employeeType: 'TETAP',
        isActive: true,
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        {
          employee: {
            employeeNumber: { contains: search, mode: 'insensitive' },
            employeeType: 'TETAP',
            isActive: true,
          },
        },
        {
          employee: {
            fullName: { contains: search, mode: 'insensitive' },
            employeeType: 'TETAP',
            isActive: true,
          },
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      take: 20,
      select: {
        id: true,
        name: true,
        nik: true,
        employee: {
          select: {
            employeeNumber: true,
            fullName: true,
            department: { select: { departmentName: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  // All Transactions (Ledger)

  async getTransactions(query: QuerySocialFundDto) {
    const {
      page = 1,
      limit = 10,
      sortOrder = 'desc',
      type,
      search,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SocialFundTransactionWhereInput = {};

    if (type) where.type = type;

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          recipientUser: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.socialFundTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          recipientUser: {
            select: {
              id: true,
              name: true,
              nik: true,
              employee: {
                select: {
                  employeeNumber: true,
                  fullName: true,
                  department: { select: { departmentName: true } },
                },
              },
            },
          },
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.socialFundTransaction.count({ where }),
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

  // Helpers

  private async getOrCreateBalance(tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    let balance = await client.socialFundBalance.findFirst();

    if (!balance) {
      balance = await client.socialFundBalance.create({
        data: { currentBalance: 0 },
      });
    }

    return balance;
  }

  private async recalculateBalancesAfter(
    tx: Prisma.TransactionClient,
    afterDate: Date,
  ) {
    // Get all transactions after the given date, ordered chronologically
    const transactions = await tx.socialFundTransaction.findMany({
      where: { createdAt: { gt: afterDate } },
      orderBy: { createdAt: 'asc' },
    });

    if (transactions.length === 0) return;

    // Get the balanceAfter of the transaction just before
    const previousTx = await tx.socialFundTransaction.findFirst({
      where: { createdAt: { lte: afterDate } },
      orderBy: { createdAt: 'desc' },
    });

    let runningBalance = previousTx
      ? previousTx.balanceAfter
      : new Prisma.Decimal(0);

    for (const txn of transactions) {
      if (txn.type === SocialFundTransactionType.SANTUNAN) {
        runningBalance = runningBalance.sub(txn.amount);
      } else {
        runningBalance = runningBalance.add(txn.amount);
      }

      await tx.socialFundTransaction.update({
        where: { id: txn.id },
        data: { balanceAfter: runningBalance },
      });
    }
  }
}
