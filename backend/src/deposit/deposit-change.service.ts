import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { DepositOptionService } from './deposit-option.service';
import { CreateDepositChangeDto } from './dto/deposit-change/create-deposit-change.dto';
import { UpdateDepositChangeDto } from './dto/deposit-change/update-deposit-change.dto';
import { ApproveDepositChangeDto } from './dto/deposit-change/approve-deposit-change.dto';
import { BulkApproveDepositChangeDto } from './dto/deposit-change/bulk-approve-deposit-change.dto';
import { QueryDepositChangeDto } from './dto/deposit-change/query-deposit-change.dto';
import {
  DepositStatus,
  DepositChangeStatus,
  DepositChangeApprovalStep,
  DepositChangeApprovalDecision,
  DepositChangeType,
  Prisma,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class DepositChangeService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private depositOptionService: DepositOptionService,
  ) {}

  /**
   * Generate change request number: CHG-YYYYMMDD-XXXX
   */
  private async generateChangeNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]. replace(/-/g, '');

    const lastChange = await this.prisma.depositChangeRequest.findFirst({
      where: {
        changeNumber: {
          startsWith: `CHG-${dateStr}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastChange) {
      const lastSequence = parseInt(lastChange.changeNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `CHG-${dateStr}-${sequence. toString().padStart(4, '0')}`;
  }

  /**
   * Get admin fee from settings
   */
  private async getAdminFee(): Promise<number> {
    const setting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'deposit_change_admin_fee' },
    });
    return setting ?  parseFloat(setting.value) : 15000;
  }

  /**
   * Get deposit settings (interest rate and calculation method)
   */
  private async getDepositSettings() {
    const [interestSetting, calculationMethodSetting] = await Promise.all([
      this.prisma. cooperativeSetting.findUnique({
        where: { key: 'deposit_interest_rate' },
      }),
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_calculation_method' },
      }),
    ]);

    return {
      interestRate: interestSetting ?  parseFloat(interestSetting.value) : 6,
      calculationMethod: (calculationMethodSetting?.value || 'SIMPLE') as 'SIMPLE' | 'COMPOUND',
    };
  }

  /**
   * Determine change type based on current vs new values
   */
  private determineChangeType(
    currentAmountCode: string,
    currentTenorCode: string,
    newAmountCode: string,
    newTenorCode: string,
  ): DepositChangeType {
    const amountChanged = currentAmountCode !== newAmountCode;
    const tenorChanged = currentTenorCode !== newTenorCode;

    if (amountChanged && tenorChanged) {
      return DepositChangeType.BOTH;
    } else if (amountChanged) {
      return DepositChangeType.AMOUNT_CHANGE;
    } else if (tenorChanged) {
      return DepositChangeType.TENOR_CHANGE;
    }

    throw new BadRequestException('Tidak ada perubahan yang diajukan');
  }

  /**
   * Check if deposit status is eligible for change
   */
  private isEligibleForChange(status: DepositStatus): boolean {
    return status === DepositStatus.APPROVED || status === DepositStatus.ACTIVE;
  }

  /**
   * Validate deposit is eligible for change
   */
  private async validateDepositForChange(depositId: string, userId: string) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
        changeRequests: {
          where: {
            status: {
              in: [
                DepositChangeStatus.DRAFT,
                DepositChangeStatus.SUBMITTED,
                DepositChangeStatus.UNDER_REVIEW_DSP,
                DepositChangeStatus.UNDER_REVIEW_KETUA,
              ],
            },
          },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    if (deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
    }

    // Only allow changes for APPROVED or ACTIVE deposits
    if (! this.isEligibleForChange(deposit.status)) {
      throw new BadRequestException(
        'Hanya deposito yang sudah disetujui atau aktif yang dapat diubah',
      );
    }

    // Check for pending change requests
    if (deposit.changeRequests.length > 0) {
      throw new BadRequestException(
        'Sudah ada pengajuan perubahan yang sedang diproses untuk deposito ini',
      );
    }

    return deposit;
  }

  /**
   * Create draft change request
   */
  async createDraft(userId: string, dto: CreateDepositChangeDto) {
    const deposit = await this.validateDepositForChange(dto.depositApplicationId, userId);

    if (!dto.agreedToTerms) {
      throw new BadRequestException('Anda harus menyetujui syarat dan ketentuan');
    }

    if (!dto.agreedToAdminFee) {
      throw new BadRequestException('Anda harus menyetujui biaya admin');
    }

    // Validate new amount option
    const newAmountOption = await this.depositOptionService. findAmountOptionByCode(dto.newAmountCode);
    if (!newAmountOption. isActive) {
      throw new BadRequestException('Opsi jumlah deposito tidak aktif');
    }

    // Validate new tenor option
    const newTenorOption = await this.depositOptionService. findTenorOptionByCode(dto.newTenorCode);
    if (!newTenorOption.isActive) {
      throw new BadRequestException('Opsi tenor deposito tidak aktif');
    }

    // Determine change type
    const changeType = this.determineChangeType(
      deposit.depositAmountCode,
      deposit.depositTenorCode,
      dto.newAmountCode,
      dto.newTenorCode,
    );

    const settings = await this.getDepositSettings();
    const adminFee = await this.getAdminFee();
    const changeNumber = await this.generateChangeNumber();

    // Calculate new projections
    const newAmountValue = newAmountOption.amount. toNumber();
    const newTenorMonths = newTenorOption. months;
    const newCalculation = this.depositOptionService.calculateDepositReturn(
      newAmountValue,
      newTenorMonths,
      settings.interestRate,
      settings.calculationMethod,
    );

    const changeRequest = await this.prisma.depositChangeRequest.create({
      data: {
        changeNumber,
        depositApplicationId: deposit.id,
        userId,
        changeType,

        // Current values
        currentAmountCode: deposit.depositAmountCode,
        currentTenorCode: deposit.depositTenorCode,
        currentAmountValue: deposit.amountValue,
        currentTenorMonths: deposit.tenorMonths,
        currentInterestRate: deposit.interestRate,
        currentProjectedInterest: deposit.projectedInterest,
        currentTotalReturn: deposit.totalReturn,

        // New values
        newAmountCode: dto.newAmountCode,
        newTenorCode: dto.newTenorCode,
        newAmountValue,
        newTenorMonths,
        newInterestRate: settings.interestRate,
        newProjectedInterest: newCalculation.projectedInterest,
        newTotalReturn: newCalculation.totalReturn,

        adminFee,
        agreedToTerms: dto.agreedToTerms,
        agreedToAdminFee: dto.agreedToAdminFee,
        status: DepositChangeStatus.DRAFT,
      },
      include: {
        depositApplication: true,
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
      message: 'Draft perubahan deposito berhasil dibuat',
      changeRequest,
      comparison: {
        current: {
          amountCode: deposit.depositAmountCode,
          tenorCode: deposit. depositTenorCode,
          amountValue: deposit.amountValue. toNumber(),
          tenorMonths: deposit.tenorMonths,
          interestRate: deposit.interestRate?. toNumber(),
          projectedInterest: deposit.projectedInterest?.toNumber(),
          totalReturn: deposit. totalReturn?.toNumber(),
        },
        new: {
          amountCode: dto.newAmountCode,
          tenorCode: dto.newTenorCode,
          amountValue: newAmountValue,
          tenorMonths: newTenorMonths,
          interestRate: settings.interestRate,
          projectedInterest: newCalculation.projectedInterest,
          totalReturn: newCalculation.totalReturn,
        },
        adminFee,
        changeType,
      },
    };
  }

  /**
   * Update draft change request
   */
  async updateDraft(userId: string, changeId: string, dto: UpdateDepositChangeDto) {
    const changeRequest = await this.prisma. depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        depositApplication: true,
      },
    });

    if (! changeRequest) {
      throw new NotFoundException('Pengajuan perubahan tidak ditemukan');
    }

    if (changeRequest.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    if (changeRequest.status !== DepositChangeStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa diupdate');
    }

    const updateData: Prisma.DepositChangeRequestUpdateInput = {};
    let newAmountCode = changeRequest.newAmountCode;
    let newTenorCode = changeRequest. newTenorCode;
    let needsRecalculation = false;

    if (dto.newAmountCode) {
      const amountOption = await this.depositOptionService.findAmountOptionByCode(dto.newAmountCode);
      if (!amountOption.isActive) {
        throw new BadRequestException('Opsi jumlah deposito tidak aktif');
      }
      updateData.newAmountCode = dto.newAmountCode;
      updateData. newAmountValue = amountOption.amount.toNumber();
      newAmountCode = dto.newAmountCode;
      needsRecalculation = true;
    }

    if (dto.newTenorCode) {
      const tenorOption = await this. depositOptionService.findTenorOptionByCode(dto.newTenorCode);
      if (! tenorOption.isActive) {
        throw new BadRequestException('Opsi tenor deposito tidak aktif');
      }
      updateData.newTenorCode = dto.newTenorCode;
      updateData.newTenorMonths = tenorOption. months;
      newTenorCode = dto.newTenorCode;
      needsRecalculation = true;
    }

    // Validate there's an actual change
    const changeType = this.determineChangeType(
      changeRequest.currentAmountCode,
      changeRequest.currentTenorCode,
      newAmountCode,
      newTenorCode,
    );
    updateData.changeType = changeType;

    if (dto.agreedToTerms !== undefined) {
      updateData. agreedToTerms = dto. agreedToTerms;
    }

    if (dto.agreedToAdminFee !== undefined) {
      updateData.agreedToAdminFee = dto.agreedToAdminFee;
    }

    // Recalculate if needed
    if (needsRecalculation) {
      const settings = await this.getDepositSettings();
      const newAmountOption = await this.depositOptionService. findAmountOptionByCode(newAmountCode);
      const newTenorOption = await this. depositOptionService.findTenorOptionByCode(newTenorCode);

      const calculation = this.depositOptionService.calculateDepositReturn(
        newAmountOption.amount.toNumber(),
        newTenorOption.months,
        settings.interestRate,
        settings.calculationMethod,
      );

      updateData.newInterestRate = settings.interestRate;
      updateData.newProjectedInterest = calculation.projectedInterest;
      updateData.newTotalReturn = calculation.totalReturn;
    }

    const updated = await this.prisma.depositChangeRequest.update({
      where: { id: changeId },
      data: updateData,
      include: {
        depositApplication: true,
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
      message: 'Draft perubahan deposito berhasil diupdate',
      changeRequest: updated,
    };
  }

  /**
   * Submit change request
   */
  async submitChangeRequest(userId: string, changeId: string) {
    const changeRequest = await this.prisma.depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        user: true,
        depositApplication: true,
      },
    });

    if (!changeRequest) {
      throw new NotFoundException('Pengajuan perubahan tidak ditemukan');
    }

    if (changeRequest. userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    if (changeRequest. status !== DepositChangeStatus. DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa disubmit');
    }

    if (! changeRequest.agreedToTerms) {
      throw new BadRequestException('Anda harus menyetujui syarat dan ketentuan');
    }

    if (!changeRequest.agreedToAdminFee) {
      throw new BadRequestException('Anda harus menyetujui biaya admin');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update status
      const updated = await tx.depositChangeRequest. update({
        where: { id: changeId },
        data: {
          status: DepositChangeStatus.SUBMITTED,
          currentStep: DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM,
          submittedAt: new Date(),
        },
      });

      // Create approval records
      await tx.depositChangeApproval.createMany({
        data: [
          {
            depositChangeRequestId: changeId,
            step: DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM,
          },
          {
            depositChangeRequestId: changeId,
            step: DepositChangeApprovalStep.KETUA,
          },
        ],
      });

      // Save history
      await tx.depositChangeHistory.create({
        data: {
          depositChangeRequestId: changeId,
          status: DepositChangeStatus. SUBMITTED,
          changeType: changeRequest.changeType,
          currentAmountValue: changeRequest.currentAmountValue,
          currentTenorMonths: changeRequest.currentTenorMonths,
          newAmountValue: changeRequest.newAmountValue,
          newTenorMonths: changeRequest. newTenorMonths,
          adminFee: changeRequest.adminFee,
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
        changeId,
        DepositChangeApprovalStep. DIVISI_SIMPAN_PINJAM,
        'NEW_CHANGE_REQUEST',
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      message: 'Pengajuan perubahan deposito berhasil disubmit.  Menunggu review dari Divisi Simpan Pinjam.',
      changeRequest: result,
    };
  }

  /**
   * Get my change requests
   */
  async getMyChangeRequests(
    userId: string,
    query: QueryDepositChangeDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      changeType,
      depositApplicationId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.DepositChangeRequestWhereInput = { userId };

    if (status) where.status = status;
    if (changeType) where.changeType = changeType;
    if (depositApplicationId) where.depositApplicationId = depositApplicationId;

    if (search) {
      where. OR = [
        { changeNumber: { contains: search, mode: 'insensitive' } },
        { depositApplication: { depositNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma. depositChangeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          depositApplication: true,
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
      this. prisma.depositChangeRequest.count({ where }),
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

  /**
   * Get change request by ID
   */
  async getChangeRequestById(changeId: string, userId?: string) {
    const changeRequest = await this.prisma.depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        depositApplication: true,
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

    if (!changeRequest) {
      throw new NotFoundException('Pengajuan perubahan tidak ditemukan');
    }

    if (userId && changeRequest.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    // Add calculation comparison
    const settings = await this.getDepositSettings();

    const currentCalculation = this.depositOptionService. calculateDepositReturn(
      changeRequest.currentAmountValue. toNumber(),
      changeRequest. currentTenorMonths,
      changeRequest.currentInterestRate?. toNumber() || settings.interestRate,
      settings.calculationMethod,
    );

    const newCalculation = this.depositOptionService.calculateDepositReturn(
      changeRequest.newAmountValue.toNumber(),
      changeRequest.newTenorMonths,
      changeRequest. newInterestRate?.toNumber() || settings.interestRate,
      settings.calculationMethod,
    );

    return {
      ...changeRequest,
      comparison: {
        current: {
          ... currentCalculation,
          amountCode: changeRequest.currentAmountCode,
          tenorCode: changeRequest.currentTenorCode,
        },
        new: {
          ...newCalculation,
          amountCode: changeRequest.newAmountCode,
          tenorCode: changeRequest.newTenorCode,
        },
        difference: {
          amount: changeRequest.newAmountValue.toNumber() - changeRequest.currentAmountValue.toNumber(),
          tenor: changeRequest.newTenorMonths - changeRequest.currentTenorMonths,
          projectedInterest: newCalculation. projectedInterest - currentCalculation.projectedInterest,
          totalReturn: newCalculation.totalReturn - currentCalculation.totalReturn,
        },
        adminFee: changeRequest.adminFee. toNumber(),
      },
    };
  }

  /**
   * Get all change requests (for approvers/admin)
   */
  async getAllChangeRequests(query: QueryDepositChangeDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      step,
      changeType,
      userId,
      depositApplicationId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.DepositChangeRequestWhereInput = {};

    if (status) where.status = status;
    if (step) where.currentStep = step;
    if (changeType) where. changeType = changeType;
    if (userId) where.userId = userId;
    if (depositApplicationId) where.depositApplicationId = depositApplicationId;

    if (search) {
      where.OR = [
        { changeNumber: { contains: search, mode: 'insensitive' } },
        { depositApplication: { depositNumber: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { employee: { employeeNumber: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt. gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.submittedAt.lte = endDateTime;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma. depositChangeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          depositApplication: true,
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
      this.prisma.depositChangeRequest.count({ where }),
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

  /**
   * Process approval (DSP, Ketua)
   */
  async processApproval(
    changeId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveDepositChangeDto,
  ) {
    const changeRequest = await this.prisma.depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        user: true,
        depositApplication: true,
        approvals: true,
      },
    });

    if (!changeRequest) {
      throw new NotFoundException('Pengajuan perubahan tidak ditemukan');
    }

    if (! changeRequest.currentStep) {
      throw new BadRequestException('Pengajuan tidak dalam status review');
    }

    // Map role to step
    const roleStepMap: { [key: string]: DepositChangeApprovalStep } = {
      divisi_simpan_pinjam: DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: DepositChangeApprovalStep.KETUA,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === changeRequest.currentStep);

    if (!approverStep) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk approve di step ini');
    }

    const approvalRecord = changeRequest.approvals.find(
      (a) => a.step === changeRequest.currentStep,
    );

    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    if (dto.decision === DepositChangeApprovalDecision.REJECTED) {
      return this.handleRejection(changeRequest, approvalRecord, approverId, dto);
    } else {
      return this.handleApproval(changeRequest, approvalRecord, approverId, dto);
    }
  }

  /**
   * Handle rejection
   */
  private async handleRejection(
    changeRequest: any,
    approvalRecord: any,
    approverId: string,
    dto: ApproveDepositChangeDto,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.depositChangeApproval. update({
        where: { id: approvalRecord.id },
        data: {
          decision: DepositChangeApprovalDecision.REJECTED,
          decidedAt: new Date(),
          approverId,
          notes: dto.notes,
        },
      });

      await tx.depositChangeRequest.update({
        where: { id: changeRequest.id },
        data: {
          status: DepositChangeStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: dto.notes,
          currentStep: null,
        },
      });

      await tx.depositChangeHistory. create({
        data: {
          depositChangeRequestId: changeRequest.id,
          status: DepositChangeStatus.REJECTED,
          changeType: changeRequest. changeType,
          currentAmountValue: changeRequest.currentAmountValue,
          currentTenorMonths: changeRequest.currentTenorMonths,
          newAmountValue: changeRequest.newAmountValue,
          newTenorMonths: changeRequest. newTenorMonths,
          adminFee: changeRequest. adminFee,
          action: 'REJECTED',
          actionAt: new Date(),
          actionBy: approverId,
          notes: dto.notes,
        },
      });
    });

    // Notify applicant
    try {
      await this.mailService.sendDepositChangeRejected(
        changeRequest.user. email,
        changeRequest.user.name,
        changeRequest. changeNumber,
        changeRequest.depositApplication.depositNumber,
        dto.notes || 'Tidak ada catatan',
      );
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }

    return { message: 'Pengajuan perubahan deposito berhasil ditolak' };
  }

  /**
   * Handle approval
   */
  private async handleApproval(
    changeRequest: any,
    approvalRecord: any,
    approverId: string,
    dto: ApproveDepositChangeDto,
  ) {
    const stepOrder = [
      DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM,
      DepositChangeApprovalStep.KETUA,
    ];

    const currentIndex = stepOrder.indexOf(changeRequest.currentStep);
    const isLastStep = currentIndex === stepOrder.length - 1;
    const nextStep = isLastStep ? null : stepOrder[currentIndex + 1];

    await this.prisma.$transaction(async (tx) => {
      // Update approval record
      await tx.depositChangeApproval.update({
        where: { id: approvalRecord.id },
        data: {
          decision: DepositChangeApprovalDecision.APPROVED,
          decidedAt: new Date(),
          approverId,
          notes: dto.notes,
        },
      });

      const newStatus = isLastStep
        ? DepositChangeStatus. APPROVED
        : changeRequest.status;

      // Update change request
      await tx. depositChangeRequest.update({
        where: { id: changeRequest. id },
        data: {
          status: newStatus,
          currentStep: nextStep,
          ...(isLastStep && {
            approvedAt: new Date(),
            effectiveDate: new Date(),
          }),
        },
      });

      // If final approval, update the actual deposit
      if (isLastStep) {
        await tx.depositApplication.update({
          where: { id: changeRequest.depositApplicationId },
          data: {
            depositAmountCode: changeRequest.newAmountCode,
            depositTenorCode: changeRequest.newTenorCode,
            amountValue: changeRequest.newAmountValue,
            tenorMonths: changeRequest.newTenorMonths,
            interestRate: changeRequest.newInterestRate,
            projectedInterest: changeRequest.newProjectedInterest,
            totalReturn: changeRequest.newTotalReturn,
            // Recalculate maturity date
            maturityDate: new Date(
              new Date(). setMonth(new Date().getMonth() + changeRequest.newTenorMonths),
            ),
          },
        });
      }

      // Save history
      await tx.depositChangeHistory.create({
        data: {
          depositChangeRequestId: changeRequest.id,
          status: newStatus,
          changeType: changeRequest.changeType,
          currentAmountValue: changeRequest.currentAmountValue,
          currentTenorMonths: changeRequest.currentTenorMonths,
          newAmountValue: changeRequest.newAmountValue,
          newTenorMonths: changeRequest.newTenorMonths,
          adminFee: changeRequest.adminFee,
          action: 'APPROVED',
          actionAt: new Date(),
          actionBy: approverId,
          notes: dto. notes,
        },
      });
    });

    if (isLastStep) {
      // Notify applicant and payroll
      try {
        await this.notifyChangeApproved(changeRequest. id);
      } catch (error) {
        console.error('Failed to send approval notifications:', error);
      }

      return {
        message: 'Perubahan deposito berhasil disetujui dan telah diterapkan.',
      };
    } else {
      // Notify next approver
      try {
        await this.notifyApprovers(changeRequest.id, nextStep!, 'APPROVAL_REQUEST');
      } catch (error) {
        console.error('Failed to notify next approver:', error);
      }

      return {
        message: 'Pengajuan perubahan berhasil disetujui.  Menunggu approval dari Ketua.',
      };
    }
  }

  /**
   * Bulk process approvals
   */
  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveDepositChangeDto,
  ) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const changeId of dto.changeRequestIds) {
      try {
        await this.processApproval(changeId, approverId, approverRoles, {
          decision: dto.decision,
          notes: dto.notes,
        });
        results.success.push(changeId);
      } catch (error) {
        results.failed.push({
          id: changeId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results. success.length} pengajuan, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Cancel change request (only for DRAFT status)
   */
  async cancelChangeRequest(userId: string, changeId: string) {
    const changeRequest = await this.prisma.depositChangeRequest.findUnique({
      where: { id: changeId },
    });

    if (!changeRequest) {
      throw new NotFoundException('Pengajuan perubahan tidak ditemukan');
    }

    if (changeRequest.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    if (changeRequest.status !== DepositChangeStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa dibatalkan');
    }

    await this.prisma. depositChangeRequest.delete({
      where: { id: changeId },
    });

    return { message: 'Pengajuan perubahan deposito berhasil dibatalkan' };
  }

  /**
   * Preview change calculation
   */
  async previewChangeCalculation(
    depositId: string,
    newAmountCode: string,
    newTenorCode: string,
  ) {
    const deposit = await this.prisma.depositApplication.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposito tidak ditemukan');
    }

    const [newAmountOption, newTenorOption, settings, adminFee] = await Promise.all([
      this.depositOptionService.findAmountOptionByCode(newAmountCode),
      this.depositOptionService.findTenorOptionByCode(newTenorCode),
      this. getDepositSettings(),
      this. getAdminFee(),
    ]);

    const currentCalculation = this.depositOptionService.calculateDepositReturn(
      deposit.amountValue.toNumber(),
      deposit.tenorMonths,
      deposit.interestRate?.toNumber() || settings. interestRate,
      settings. calculationMethod,
    );

    const newCalculation = this. depositOptionService.calculateDepositReturn(
      newAmountOption. amount.toNumber(),
      newTenorOption.months,
      settings.interestRate,
      settings.calculationMethod,
    );

    // Determine change type
    let changeType: DepositChangeType | null = null;
    const amountChanged = deposit.depositAmountCode !== newAmountCode;
    const tenorChanged = deposit.depositTenorCode !== newTenorCode;

    if (amountChanged && tenorChanged) {
      changeType = DepositChangeType. BOTH;
    } else if (amountChanged) {
      changeType = DepositChangeType. AMOUNT_CHANGE;
    } else if (tenorChanged) {
      changeType = DepositChangeType.TENOR_CHANGE;
    }

    return {
      current: {
        amountCode: deposit. depositAmountCode,
        tenorCode: deposit.depositTenorCode,
        ... currentCalculation,
      },
      new: {
        amountCode: newAmountCode,
        tenorCode: newTenorCode,
        ...newCalculation,
      },
      difference: {
        amount: newAmountOption.amount. toNumber() - deposit.amountValue.toNumber(),
        tenor: newTenorOption.months - deposit. tenorMonths,
        projectedInterest: newCalculation.projectedInterest - currentCalculation.projectedInterest,
        totalReturn: newCalculation.totalReturn - currentCalculation. totalReturn,
      },
      adminFee,
      changeType,
      hasChanges: changeType !== null,
    };
  }

  // ============ NOTIFICATION HELPERS ============

  private async notifyApprovers(
    changeId: string,
    step: DepositChangeApprovalStep,
    type: string,
  ) {
    const changeRequest = await this.prisma. depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
        depositApplication: true,
      },
    });

    if (! changeRequest) return;

    const roleName =
      step === DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM
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
        await this.mailService.sendDepositChangeApprovalRequest(
          approver.email,
          approver.name,
          changeRequest.user.name,
          changeRequest. changeNumber,
          changeRequest.depositApplication.depositNumber,
          changeRequest.currentAmountValue. toNumber(),
          changeRequest.newAmountValue.toNumber(),
          roleName,
        );
      } catch (error) {
        console.error(`Failed to send approval request to ${approver.email}:`, error);
      }
    }
  }

  private async notifyChangeApproved(changeId: string) {
    const changeRequest = await this. prisma.depositChangeRequest.findUnique({
      where: { id: changeId },
      include: {
        user: true,
        depositApplication: true,
      },
    });

    if (!changeRequest) return;

    // Notify applicant
    try {
      await this.mailService.sendDepositChangeApproved(
        changeRequest.user.email,
        changeRequest.user.name,
        changeRequest.changeNumber,
        changeRequest.depositApplication.depositNumber,
        changeRequest.currentAmountValue.toNumber(),
        changeRequest.newAmountValue.toNumber(),
        changeRequest.currentTenorMonths,
        changeRequest.newTenorMonths,
        changeRequest.adminFee. toNumber(),
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
        await this.mailService.sendDepositChangePayrollNotification(
          payroll. email,
          payroll.name,
          changeRequest.user. name,
          changeRequest.changeNumber,
          changeRequest.depositApplication.depositNumber,
          changeRequest.currentAmountValue.toNumber(),
          changeRequest.newAmountValue.toNumber(),
          changeRequest.adminFee.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send payroll notification to ${payroll.email}:`, error);
      }
    }
  }
}