import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryLoanDto } from '../dto/query-loan.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { LoanHandlerFactory } from '../handlers/loan-handler.factory';

@Injectable()
export class LoanQueryService {
  constructor(
    private prisma: PrismaService,
    private loanHandlerFactory: LoanHandlerFactory,
  ) { }

  /**
   * Get my loans
   */
  async getMyLoans(
    userId: string,
    query: QueryLoanDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      loanType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) where.status = status;
    if (loanType) where.loanType = loanType;

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { loanPurpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [loans, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              employee: {
                include: {
                  department: true,
                  golongan: true,
                },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          disbursement: {
            include: {
              processedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          authorization: {
            include: {
              authorizedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          cashLoanDetails: true,
          goodsReimburseDetails: true,
          goodsOnlineDetails: true,
          goodsPhoneDetails: true,
          loanInstallments: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: loans,
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

  /**
   * Get all loans (for approvers/admins)
   */
  async getAllLoans(query: QueryLoanDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      step,
      userId,
      loanType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (step) where.currentStep = step;
    if (userId) where.userId = userId;
    if (loanType) where.loanType = loanType;

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { loanPurpose: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          user: {
            employee: {
              employeeNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.submittedAt.lte = endDateTime;
      }
    }

    const [loans, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              employee: {
                include: {
                  department: true,
                  golongan: true,
                },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          disbursement: {
            include: {
              processedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          authorization: {
            include: {
              authorizedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          cashLoanDetails: true,
          goodsReimburseDetails: true,
          goodsOnlineDetails: true,
          goodsPhoneDetails: true,
          loanInstallments: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: loans,
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

  /**
   * Get loan by ID
   */
  async getLoanById(loanId: string) {
    return this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: true,
                golongan: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        disbursement: {
          include: {
            processedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        authorization: {
          include: {
            authorizedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        history: {
          include: {
            actionByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        cashLoanDetails: true,
        goodsReimburseDetails: true,
        goodsOnlineDetails: true,
        goodsPhoneDetails: true,
        loanInstallments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });
  }
}
