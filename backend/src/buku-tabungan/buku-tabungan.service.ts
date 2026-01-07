import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { QueryBukuTabunganDto } from './dto/query-buku-tabungan.dto';
import { QueryAllBukuTabunganDto } from './dto/query-all-buku-tabungan.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import {
  BukuTabunganResponse,
  BukuTabunganListItem,
  SaldoSummary,
  TransactionSummary,
} from './interfaces/buku-tabungan.interface';
import {
  DEFAULT_INCLUDE_ACCOUNT,
  DEFAULT_INCLUDE_TRANSACTION,
  DEFAULT_INCLUDE_ACCOUNT_LIST,
} from './constants/buku-tabungan.constant';
import { Prisma, SavingsTransaction } from '@prisma/client';

@Injectable()
export class BukuTabunganService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all savings accounts with pagination (for admin roles)
   */
  async findAll(
    query: QueryAllBukuTabunganDto,
  ): Promise<PaginatedResult<BukuTabunganListItem>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      departmentId,
      employeeType,
      isExport,
    } = query;

    const skip = isExport ? undefined : (page - 1) * limit;
    const take = isExport ? undefined : limit;

    // Build employee filter
    const employeeFilter: Prisma.EmployeeWhereInput = {};
    if (departmentId) {
      employeeFilter.departmentId = departmentId;
    }
    if (employeeType) {
      employeeFilter.employeeType = employeeType;
    }

    const where: Prisma.SavingsAccountWhereInput = {};

    // Search by user name or employee number
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { employee: { fullName: { contains: search, mode: 'insensitive' } } },
          {
            employee: {
              employeeNumber: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      };
    }

    // Apply employee filters (department, employeeType)
    if (Object.keys(employeeFilter).length > 0) {
      if (where.user) {
        where.user = {
          AND: [where.user, { employee: employeeFilter }],
        };
      } else {
        where.user = { employee: employeeFilter };
      }
    }

    const orderBy: Prisma.SavingsAccountOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.savingsAccount.findMany({
        where,
        skip,
        take,
        orderBy,
        include: DEFAULT_INCLUDE_ACCOUNT_LIST,
      }),
      this.prisma.savingsAccount.count({ where }),
    ]);

    // Transform data with totalSaldo calculation
    const transformedData: BukuTabunganListItem[] = data.map((account) => {
      const totalSaldo = new Prisma.Decimal(0)
        .add(account.saldoPokok)
        .add(account.saldoWajib)
        .add(account.saldoSukarela)
        .add(account.bungaDeposito);

      return {
        ...account,
        totalSaldo,
      } as BukuTabunganListItem;
    });

    const totalPages = isExport ? 1 : Math.ceil(total / limit);

    return {
      data: transformedData,
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

  /**
   * Get savings account by user ID with optional transaction summary
   */
  async getTabunganByUserId(
    userId: string,
    query?: QueryBukuTabunganDto,
  ): Promise<BukuTabunganResponse> {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { userId: userId },
      include: DEFAULT_INCLUDE_ACCOUNT,
    });

    if (!account) {
      throw new NotFoundException('Buku tabungan tidak ditemukan');
    }

    const summary = this.calculateSaldoSummary(account);

    const response: BukuTabunganResponse = {
      account: account as BukuTabunganResponse['account'],
      summary,
    };

    if (query?.includeTransactionSummary) {
      response.transactionSummary = await this.getTransactionSummary(
        account.id,
      );
    }

    return response;
  }

  /**
   * Get paginated transactions for a savings account
   */
  async getTransactionsByUserId(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResult<SavingsTransaction>> {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Buku tabungan tidak ditemukan');
    }

    return this.getTransactionsByAccountId(account.id, query);
  }

  /**
   * Get paginated transactions by account ID
   */
  async getTransactionsByAccountId(
    accountId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResult<SavingsTransaction>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      startDate,
      endDate,
      payrollPeriodId,
      month,
      year,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.SavingsTransactionWhereInput = {
      savingsAccountId: accountId,
    };

    // Filter by payroll period
    if (payrollPeriodId) {
      where.payrollPeriodId = payrollPeriodId;
    }

    // Filter by month and year (from payroll period)
    if (month || year) {
      where.payrollPeriod = {};
      if (month) where.payrollPeriod.month = month;
      if (year) where.payrollPeriod.year = year;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.transactionDate.lte = endDateTime;
      }
    }

    const orderBy: Prisma.SavingsTransactionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      this.prisma.savingsTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: DEFAULT_INCLUDE_TRANSACTION,
      }),
      this.prisma.savingsTransaction.count({ where }),
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

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<SavingsTransaction> {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Buku tabungan tidak ditemukan');
    }

    const transaction = await this.prisma.savingsTransaction.findFirst({
      where: {
        id: transactionId,
        savingsAccountId: account.id,
      },
      include: DEFAULT_INCLUDE_TRANSACTION,
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    return transaction;
  }

  /**
   * Calculate saldo summary from account
   */
  private calculateSaldoSummary(account: {
    saldoPokok: Prisma.Decimal;
    saldoWajib: Prisma.Decimal;
    saldoSukarela: Prisma.Decimal;
    bungaDeposito: Prisma.Decimal;
  }): SaldoSummary {
    const totalSaldo = new Prisma.Decimal(0)
      .add(account.saldoPokok)
      .add(account.saldoWajib)
      .add(account.saldoSukarela)
      .add(account.bungaDeposito);

    return {
      saldoPokok: account.saldoPokok,
      saldoWajib: account.saldoWajib,
      saldoSukarela: account.saldoSukarela,
      bungaDeposito: account.bungaDeposito,
      totalSaldo,
    };
  }

  /**
   * Get transaction summary by account ID
   */
  private async getTransactionSummary(
    accountId: string,
  ): Promise<TransactionSummary> {
    const result = await this.prisma.savingsTransaction.aggregate({
      where: { savingsAccountId: accountId },
      _sum: {
        iuranPendaftaran: true,
        iuranBulanan: true,
        tabunganDeposito: true,
        shu: true,
        penarikan: true,
        bunga: true,
      },
    });

    return {
      totalIuranPendaftaran:
        result._sum.iuranPendaftaran || new Prisma.Decimal(0),
      totalIuranBulanan: result._sum.iuranBulanan || new Prisma.Decimal(0),
      totalTabunganDeposito:
        result._sum.tabunganDeposito || new Prisma.Decimal(0),
      totalShu: result._sum.shu || new Prisma.Decimal(0),
      totalPenarikan: result._sum.penarikan || new Prisma.Decimal(0),
      totalBunga: result._sum.bunga || new Prisma.Decimal(0),
    };
  }

  /**
   * Get transaction summary by period (for reports)
   */
  async getTransactionSummaryByPeriod(
    userId: string,
    month: number,
    year: number,
  ): Promise<TransactionSummary | null> {
    const account = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Buku tabungan tidak ditemukan');
    }

    const result = await this.prisma.savingsTransaction.aggregate({
      where: {
        savingsAccountId: account.id,
        payrollPeriod: {
          month,
          year,
        },
      },
      _sum: {
        iuranPendaftaran: true,
        iuranBulanan: true,
        tabunganDeposito: true,
        shu: true,
        penarikan: true,
        bunga: true,
      },
    });

    if (!result._sum.iuranPendaftaran && !result._sum.iuranBulanan) {
      return null;
    }

    return {
      totalIuranPendaftaran:
        result._sum.iuranPendaftaran || new Prisma.Decimal(0),
      totalIuranBulanan: result._sum.iuranBulanan || new Prisma.Decimal(0),
      totalTabunganDeposito:
        result._sum.tabunganDeposito || new Prisma.Decimal(0),
      totalShu: result._sum.shu || new Prisma.Decimal(0),
      totalPenarikan: result._sum.penarikan || new Prisma.Decimal(0),
      totalBunga: result._sum.bunga || new Prisma.Decimal(0),
    };
  }
}
