import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { DepositOptionService } from './deposit-option.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { ApproveDepositDto } from './dto/approve-deposit.dto';
import { BulkApproveDepositDto } from './dto/bulk-approve-deposit.dto';
import { QueryDepositDto } from './dto/query-deposit.dto';
import {
  DepositStatus,
  DepositApprovalStep,
  DepositApprovalDecision,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class DepositService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private depositOptionService: DepositOptionService,
  ) {}

  /**
   * Generate deposit number: DEP-YYYYMMDD-XXXX
   */
  private async generateDepositNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastDeposit = await this.prisma.depositApplication.findFirst({
      where: {
        depositNumber: {
          startsWith: `DEP-${dateStr}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastDeposit) {
      const lastSequence = parseInt(lastDeposit.depositNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `DEP-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate deposit return
   */
  private async calculateDepositReturn(amount: number, tenorMonths: number) {
    const interestSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'deposit_interest_rate' },
    });

    const annualRate = interestSetting ? parseFloat(interestSetting.value) : 6;
    const interestRate = annualRate;

    // Calculate interest
    const projectedInterest = amount * (annualRate / 100) * (tenorMonths / 12);
    const totalReturn = amount + projectedInterest;

    return {
      interestRate,
      projectedInterest: Math.round(projectedInterest),
      totalReturn: Math.round(totalReturn),
    };
  }

  /**
   * Check if user is verified member
   */
  private async checkMemberStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.employee) {
      throw new ForbiddenException('Data karyawan tidak ditemukan');
    }

    if (!user.memberVerified) {
      throw new ForbiddenException(
        'Anda harus menjadi anggota terverifikasi untuk mengajukan deposito',
      );
    }

    return user;
  }

  /**
   * Create draft deposit application
   */
  async createDraft(userId: string, dto: CreateDepositDto) {
    const user = await this.checkMemberStatus(userId);

    if (!dto.agreedToTerms) {
      throw new BadRequestException('Anda harus menyetujui syarat dan ketentuan');
    }

    // Validate and get amount option
    const amountOption = await this.depositOptionService.findAmountOptionByCode(dto.depositAmountCode);
    if (!amountOption.isActive) {
      throw new BadRequestException('Opsi jumlah deposito tidak aktif');
    }

    // Validate and get tenor option
    const tenorOption = await this.depositOptionService.findTenorOptionByCode(dto.depositTenorCode);
    if (!tenorOption.isActive) {
      throw new BadRequestException('Opsi tenor deposito tidak aktif');
    }

    const amountValue = amountOption.amount.toNumber();
    const tenorMonths = tenorOption.months;
    const depositNumber = await this.generateDepositNumber();
    const calculations = await this.calculateDepositReturn(amountValue, tenorMonths);

    const deposit = await this.prisma.depositApplication.create({
      data: {
        depositNumber,
        userId,
        depositAmountCode: dto.depositAmountCode,
        depositTenorCode: dto.depositTenorCode,
        amountValue,
        tenorMonths,
        agreedToTerms: dto.agreedToTerms,
        status: DepositStatus.DRAFT,
        ...calculations,
      },
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
    });

    return {
      message: 'Draft deposito berhasil dibuat',
      deposit,
    };
  }

  /**
   * Update draft deposit
   */
  async updateDraft(userId: string, depositId: string, dto: UpdateDepositDto) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    if (deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
    }

    if (deposit.status !== DepositStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa diupdate');
    }

    const updateData: any = {};

    if (dto.depositAmountCode) {
      const amountOption = await this.depositOptionService.findAmountOptionByCode(dto.depositAmountCode);
      if (!amountOption.isActive) {
        throw new BadRequestException('Opsi jumlah deposito tidak aktif');
      }
      updateData.depositAmountCode = dto.depositAmountCode;
      updateData.amountValue = amountOption.amount.toNumber();
    }

    if (dto.depositTenorCode) {
      const tenorOption = await this.depositOptionService.findTenorOptionByCode(dto.depositTenorCode);
      if (!tenorOption.isActive) {
        throw new BadRequestException('Opsi tenor deposito tidak aktif');
      }
      updateData.depositTenorCode = dto.depositTenorCode;
      updateData.tenorMonths = tenorOption.months;
    }

    if (dto.agreedToTerms !== undefined) {
      updateData.agreedToTerms = dto.agreedToTerms;
    }

    // Recalculate if amount or tenor changed
    if (dto.depositAmountCode || dto.depositTenorCode) {
      const amount = updateData.amountValue ?? deposit.amountValue.toNumber();
      const tenor = updateData.tenorMonths ?? deposit.tenorMonths;
      const calculations = await this.calculateDepositReturn(amount, tenor);
      Object.assign(updateData, calculations);
    }

    const updated = await this.prisma.depositApplication.update({
      where: { id: depositId },
      data: updateData,
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
    });

    return {
      message: 'Draft deposito berhasil diupdate',
      deposit: updated,
    };
  }

  /**
   * Submit deposit application
   */
  async submitDeposit(userId: string, depositId: string) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
      include: {
        user: true,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    if (deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
    }

    if (deposit.status !== DepositStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa disubmit');
    }

    if (!deposit.agreedToTerms) {
      throw new BadRequestException('Anda harus menyetujui syarat dan ketentuan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update deposit status
      const updated = await tx.depositApplication.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.SUBMITTED,
          currentStep: DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
          submittedAt: new Date(),
        },
      });

      // Create approval records
      await tx.depositApproval.createMany({
        data: [
          { depositApplicationId: depositId, step: DepositApprovalStep.DIVISI_SIMPAN_PINJAM },
          { depositApplicationId: depositId, step: DepositApprovalStep.KETUA },
        ],
      });

      // Save history
      await tx.depositHistory.create({
        data: {
          depositApplicationId: depositId,
          status: DepositStatus.SUBMITTED,
          depositAmountCode: updated.depositAmountCode,
          depositTenorCode: updated.depositTenorCode,
          amountValue: updated.amountValue,
          tenorMonths: updated.tenorMonths,
          interestRate: updated.interestRate,
          projectedInterest: updated.projectedInterest,
          action: 'SUBMITTED',
          actionAt: new Date(),
          actionBy: userId,
        },
      });

      return updated;
    });

    // Notify DSP
    try {
      await this.notifyApprovers(
        depositId,
        DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
        'NEW_DEPOSIT',
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      message:
        'Pengajuan deposito berhasil disubmit. Menunggu review dari Divisi Simpan Pinjam.',
      deposit: result,
    };
  }

  /**
   * Get my deposit applications
   */
  async getMyDeposits(userId: string, query: QueryDepositDto): Promise<PaginatedResult<any>> {
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
      where.OR = [{ depositNumber: { contains: search, mode: 'insensitive' } }];
    }

    const [deposits, total] = await Promise.all([
      this.prisma.depositApplication.findMany({
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
        },
      }),
      this.prisma.depositApplication.count({ where }),
    ]);

    return {
      data: deposits,
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
   * Get deposit by ID
   */
  async getDepositById(depositId: string, userId?: string) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
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
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    // If userId provided, check access
    if (userId && deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
    }

    return deposit;
  }

  /**
   * Get all deposits (for approvers/admins)
   */
  async getAllDeposits(query: QueryDepositDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      step,
      userId,
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

    if (search) {
      where.OR = [
        { depositNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          user: { employee: { employeeNumber: { contains: search, mode: 'insensitive' } } },
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

    const [deposits, total] = await Promise.all([
      this.prisma.depositApplication.findMany({
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
        },
      }),
      this.prisma.depositApplication.count({ where }),
    ]);

    return {
      data: deposits,
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
   * Process approval (DSP, Ketua)
   */
  async processApproval(
    depositId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveDepositDto,
  ) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    if (!deposit.currentStep) {
      throw new BadRequestException('Deposito tidak dalam status review');
    }

    // Map role to step
    const roleStepMap: { [key: string]: DepositApprovalStep } = {
      divisi_simpan_pinjam: DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: DepositApprovalStep.KETUA,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === deposit.currentStep);

    if (!approverStep) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk approve di step ini');
    }

    const approvalRecord = deposit.approvals.find((a) => a.step === deposit.currentStep);
    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    if (dto.decision === DepositApprovalDecision.REJECTED) {
      // REJECT
      await this.prisma.$transaction(async (tx) => {
        await tx.depositApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: DepositApprovalDecision.REJECTED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        await tx.depositApplication.update({
          where: { id: depositId },
          data: {
            status: DepositStatus.REJECTED,
            rejectedAt: new Date(),
            rejectionReason: dto.notes,
            currentStep: null,
          },
        });

        await tx.depositHistory.create({
          data: {
            depositApplicationId: depositId,
            status: DepositStatus.REJECTED,
            depositAmountCode: deposit.depositAmountCode,
            depositTenorCode: deposit.depositTenorCode,
            amountValue: deposit.amountValue,
            tenorMonths: deposit.tenorMonths,
            interestRate: deposit.interestRate,
            projectedInterest: deposit.projectedInterest,
            action: 'REJECTED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      // Notify applicant
      try {
        await this.mailService.sendDepositRejected(
          deposit.user.email,
          deposit.user.name,
          deposit.depositNumber,
          dto.notes || 'Tidak ada catatan',
        );
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }

      return { message: 'Deposito berhasil ditolak' };
    } else {
      // APPROVE
      const stepOrder = [DepositApprovalStep.DIVISI_SIMPAN_PINJAM, DepositApprovalStep.KETUA];

      const currentIndex = stepOrder.indexOf(deposit.currentStep);
      const isLastStep = currentIndex === stepOrder.length - 1;
      const nextStep = isLastStep ? null : stepOrder[currentIndex + 1];

      const maturityDate = isLastStep
        ? new Date(
            new Date().setMonth(new Date().getMonth() + deposit.tenorMonths),
          )
        : null;

      await this.prisma.$transaction(async (tx) => {
        await tx.depositApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: DepositApprovalDecision.APPROVED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        const newStatus = isLastStep ? DepositStatus.APPROVED : deposit.status;

        await tx.depositApplication.update({
          where: { id: depositId },
          data: {
            status: newStatus,
            currentStep: nextStep,
            ...(isLastStep && {
              approvedAt: new Date(),
              activatedAt: new Date(),
              maturityDate,
            }),
          },
        });

        await tx.depositHistory.create({
          data: {
            depositApplicationId: depositId,
            status: newStatus,
            depositAmountCode: deposit.depositAmountCode,
            depositTenorCode: deposit.depositTenorCode,
            amountValue: deposit.amountValue,
            tenorMonths: deposit.tenorMonths,
            interestRate: deposit.interestRate,
            projectedInterest: deposit.projectedInterest,
            action: 'APPROVED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      if (isLastStep) {
        // Notify payroll and applicant
        try {
          await this.notifyDepositApproved(depositId);
        } catch (error) {
          console.error('Failed to send approval notifications:', error);
        }

        return {
          message: 'Deposito berhasil disetujui dan diaktifkan.',
        };
      } else {
        // Notify next approver
        try {
          await this.notifyApprovers(depositId, nextStep!, 'APPROVAL_REQUEST');
        } catch (error) {
          console.error('Failed to notify next approver:', error);
        }

        return {
          message: 'Deposito berhasil disetujui. Menunggu approval dari Ketua.',
        };
      }
    }
  }

  /**
   * Bulk approve/reject
   */
  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveDepositDto,
  ) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const depositId of dto.depositIds) {
      try {
        await this.processApproval(depositId, approverId, approverRoles, {
          decision: dto.decision,
          notes: dto.notes,
        });
        results.success.push(depositId);
      } catch (error) {
        results.failed.push({
          id: depositId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} deposito, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Delete draft deposit
   */
  async deleteDraft(userId: string, depositId: string) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    if (deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
    }

    if (deposit.status !== DepositStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa dihapus');
    }

    await this.prisma.depositApplication.delete({
      where: { id: depositId },
    });

    return { message: 'Draft deposito berhasil dihapus' };
  }

  // NOTIFICATION HELPERS

  private async notifyApprovers(
    depositId: string,
    step: DepositApprovalStep,
    type: string,
  ) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!deposit) return;

    const roleName =
      step === DepositApprovalStep.DIVISI_SIMPAN_PINJAM
        ? 'divisi_simpan_pinjam'
        : 'ketua';

    const approvers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: roleName,
            },
          },
        },
      },
    });

    for (const approver of approvers) {
      try {
        await this.mailService.sendDepositApprovalRequest(
          approver.email,
          approver.name,
          deposit.user.name,
          deposit.depositNumber,
          deposit.amountValue.toNumber(),
          roleName,
        );
      } catch (error) {
        console.error(`Failed to send approval request to ${approver.email}:`, error);
      }
    }
  }

  private async notifyDepositApproved(depositId: string) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
      include: {
        user: true,
      },
    });

    if (!deposit) return;

    // Notify applicant
    try {
      await this.mailService.sendDepositApproved(
        deposit.user.email,
        deposit.user.name,
        deposit.depositNumber,
        deposit.amountValue.toNumber(),
        deposit.tenorMonths,
      );
    } catch (error) {
      console.error('Failed to notify applicant:', error);
    }

    // Notify payroll
    const payrollUsers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: 'payroll',
            },
          },
        },
      },
    });

    for (const payroll of payrollUsers) {
      try {
        await this.mailService.sendDepositPayrollNotification(
          payroll.email,
          payroll.name,
          deposit.user.name,
          deposit.depositNumber,
          deposit.amountValue.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send payroll notification to ${payroll.email}:`, error);
      }
    }
  }
}