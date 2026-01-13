import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentCrudService } from './services/repayment-crud.service';
import { RepaymentApprovalService } from './services/repayment-approval.service';
import { RepaymentCalculationService } from './services/repayment-calculation.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { ApproveRepaymentDto } from './dto/approve-repayment.dto';
import { BulkApproveRepaymentDto } from './dto/bulk-approve-repayment.dto';
import { QueryRepaymentDto } from './dto/query-repayment.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class LoanRepaymentService {
  constructor(
    private prisma: PrismaService,
    private crudService: RepaymentCrudService,
    private approvalService: RepaymentApprovalService,
    private calculationService: RepaymentCalculationService,
  ) {}

  // CRUD OPERATIONS
  async createRepayment(userId: string, dto: CreateRepaymentDto) {
    return this.crudService.createRepayment(userId, dto);
  }

  async getRepaymentById(repaymentId: string, userId?: string) {
    return this.crudService.getRepaymentById(repaymentId, userId);
  }

  // APPROVAL PROCESS
  async processApproval(
    repaymentId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveRepaymentDto,
  ) {
    return this.approvalService.processApproval(
      repaymentId,
      approverId,
      approverRoles,
      dto,
    );
  }

  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveRepaymentDto,
  ) {
    return this.approvalService.bulkProcessApproval(
      approverId,
      approverRoles,
      dto,
    );
  }

  // QUERY OPERATIONS
  async getMyRepayments(
    userId: string,
    query: QueryRepaymentDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { repaymentNumber: { contains: search, mode: 'insensitive' } },
        {
          loanApplication: {
            loanNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [repayments, total] = await Promise.all([
      this.prisma.loanRepayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          loanApplication: {
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
        },
      }),
      this.prisma.loanRepayment.count({ where }),
    ]);

    return {
      data: repayments,
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

  async getAllRepayments(
    query: QueryRepaymentDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      step,
      userId,
      loanApplicationId,
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
    if (loanApplicationId) where.loanApplicationId = loanApplicationId;

    if (search) {
      where.OR = [
        { repaymentNumber: { contains: search, mode: 'insensitive' } },
        {
          loanApplication: {
            loanNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          loanApplication: {
            user: { name: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          loanApplication: {
            user: { email: { contains: search, mode: 'insensitive' } },
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

    const [repayments, total] = await Promise.all([
      this.prisma.loanRepayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          loanApplication: {
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
        },
      }),
      this.prisma.loanRepayment.count({ where }),
    ]);

    return {
      data: repayments,
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

  // CALCULATION
  async getRepaymentCalculation(loanApplicationId: string) {
    return this.calculationService.calculateRepaymentAmount(loanApplicationId);
  }
}
