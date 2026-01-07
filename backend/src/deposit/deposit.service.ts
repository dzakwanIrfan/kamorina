import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailQueueService } from '../mail/mail-queue.service';
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
  SettingCategory,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private prisma: PrismaService,
    private mailQueueService: MailQueueService,
    private depositOptionService: DepositOptionService,
  ) { }

  /**
   * Generate deposit number: DEPO-YYYYMMDD-XXXX
   */
  private async generateDepositNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const lastDeposit = await this.prisma.depositApplication.findFirst({
      where: {
        depositNumber: {
          startsWith: `DEPO-${dateStr}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastDeposit) {
      const lastSequence = parseInt(lastDeposit.depositNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `DEPO-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Get interest rate and calculation method from settings
   */
  private async getDepositSettings() {
    const [interestSetting, calculationMethodSetting] = await Promise.all([
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_interest_rate' },
      }),
      this.prisma.cooperativeSetting.findUnique({
        where: { key: 'deposit_calculation_method' },
      }),
    ]);

    return {
      interestRate: interestSetting ? parseFloat(interestSetting.value) : 6,
      calculationMethod: (calculationMethodSetting?.value || 'SIMPLE') as
        | 'SIMPLE'
        | 'COMPOUND',
    };
  }

  /**
   * Create draft deposit application
   */
  async createDraft(userId: string, dto: CreateDepositDto) {
    if (!dto.agreedToTerms) {
      throw new BadRequestException(
        'Anda harus menyetujui syarat dan ketentuan',
      );
    }

    // Validate and get amount option
    const amountOption = await this.depositOptionService.findAmountOptionByCode(
      dto.depositAmountCode,
    );
    if (!amountOption.isActive) {
      throw new BadRequestException('Opsi jumlah deposito tidak aktif');
    }

    // Validate and get tenor option
    const tenorOption = await this.depositOptionService.findTenorOptionByCode(
      dto.depositTenorCode,
    );
    if (!tenorOption.isActive) {
      throw new BadRequestException('Opsi tenor deposito tidak aktif');
    }

    const amountValue = amountOption.amount.toNumber();
    const tenorMonths = tenorOption.months;
    const depositNumber = await this.generateDepositNumber();
    const { interestRate } = await this.getDepositSettings();

    const deposit = await this.prisma.depositApplication.create({
      data: {
        depositNumber,
        userId,
        amountValue,
        tenorMonths,
        agreedToTerms: dto.agreedToTerms,
        status: DepositStatus.DRAFT,
        interestRate,
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
    let newAmountValue = deposit.amountValue.toNumber();
    let newTenorMonths = deposit.tenorMonths;

    if (dto.depositAmountCode) {
      const amountOption =
        await this.depositOptionService.findAmountOptionByCode(
          dto.depositAmountCode,
        );
      if (!amountOption.isActive) {
        throw new BadRequestException('Opsi jumlah deposito tidak aktif');
      }
      updateData.depositAmountCode = dto.depositAmountCode;
      updateData.amountValue = amountOption.amount.toNumber();
      newAmountValue = amountOption.amount.toNumber();
    }

    if (dto.depositTenorCode) {
      const tenorOption = await this.depositOptionService.findTenorOptionByCode(
        dto.depositTenorCode,
      );
      if (!tenorOption.isActive) {
        throw new BadRequestException('Opsi tenor deposito tidak aktif');
      }
      updateData.depositTenorCode = dto.depositTenorCode;
      updateData.tenorMonths = tenorOption.months;
      newTenorMonths = tenorOption.months;
    }

    if (dto.agreedToTerms !== undefined) {
      updateData.agreedToTerms = dto.agreedToTerms;
    }

    // Recalculate if amount or tenor changed
    if (dto.depositAmountCode || dto.depositTenorCode) {
      updateData.interestRate = await this.getDepositSettings().then(
        (s) => s.interestRate,
      );
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
      throw new BadRequestException(
        'Anda harus menyetujui syarat dan ketentuan',
      );
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
          {
            depositApplicationId: depositId,
            step: DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
          },
          { depositApplicationId: depositId, step: DepositApprovalStep.KETUA },
        ],
      });

      // Save history
      await tx.depositHistory.create({
        data: {
          depositApplicationId: depositId,
          status: DepositStatus.SUBMITTED,
          amountValue: updated.amountValue,
          tenorMonths: updated.tenorMonths,
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
  async getMyDeposits(
    userId: string,
    query: QueryDepositDto,
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

    return {
      ...deposit
    };
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
    // 1. Ambil data deposito
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

    // 2. Validasi Role Approver
    const roleStepMap: { [key: string]: DepositApprovalStep } = {
      divisi_simpan_pinjam: DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: DepositApprovalStep.KETUA,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === deposit.currentStep);

    if (!approverStep) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk approve di step ini',
      );
    }

    const approvalRecord = deposit.approvals.find(
      (a) => a.step === deposit.currentStep,
    );

    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    // LOGIC REJECT
    if (dto.decision === DepositApprovalDecision.REJECTED) {
      await this.prisma.$transaction(async (tx) => {
        // Update Approval Step jadi REJECTED
        await tx.depositApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: DepositApprovalDecision.REJECTED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        // Update Aplikasi Utama jadi REJECTED
        await tx.depositApplication.update({
          where: { id: depositId },
          data: {
            status: DepositStatus.REJECTED,
            rejectedAt: new Date(),
            rejectionReason: dto.notes,
            currentStep: null, // Flow berhenti
          },
        });

        // Catat History
        await tx.depositHistory.create({
          data: {
            depositApplicationId: depositId,
            status: DepositStatus.REJECTED,
            amountValue: deposit.amountValue,
            tenorMonths: deposit.tenorMonths,
            action: 'REJECTED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      // Notify User (queued)
      try {
        await this.mailQueueService.queueDepositRejected(
          deposit.user.email,
          deposit.user.name,
          deposit.depositNumber,
          dto.notes || 'Tidak ada catatan',
        );
      } catch (error) {
        this.logger.error('Failed to queue rejection email:', error);
      }

      return { message: 'Deposito berhasil ditolak' };
    }

    // LOGIC APPROVE
    else {
      const stepOrder = [
        DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
        DepositApprovalStep.KETUA,
      ];

      const currentIndex = stepOrder.indexOf(deposit.currentStep);
      const isLastStep = currentIndex === stepOrder.length - 1;
      const nextStep = isLastStep ? null : stepOrder[currentIndex + 1];

      let activationDate: Date | null = null;
      let maturityDate: Date | null = null;

      // LOGIC TANGGAL CUTOFF & GAJIAN (Hanya dijalankan di Step Terakhir/Ketua)
      if (isLastStep) {
        // Ambil Setting dari Database
        const settings = await this.prisma.cooperativeSetting.findMany({
          where: {
            category: SettingCategory.GENERAL,
            key: {
              in: ['cooperative_cutoff_date', 'cooperative_payroll_date'],
            },
          },
        });

        const cutoffSetting = settings.find(
          (s) => s.key === 'cooperative_cutoff_date',
        );
        const payrollSetting = settings.find(
          (s) => s.key === 'cooperative_payroll_date',
        );

        const cutoffDay = Number(cutoffSetting?.value) || 15; // Default 15
        const payrollDay = Number(payrollSetting?.value) || 27; // Default 27

        // Hitung Tanggal Aktivasi (Start)
        const now = new Date();
        const currentDay = now.getDate();

        // Mulai kalkulasi dari hari ini
        const startDate = new Date(now);
        // Set ke tanggal gajian
        startDate.setDate(payrollDay);

        if (currentDay > cutoffDay) {
          // Jika hari ini > tanggal cutoff (15), maka ikut gajian bulan depan
          startDate.setMonth(startDate.getMonth() + 1);
        }
        // Jika hari ini <= 15, maka tetap di bulan ini (tgl 27 bulan ini)

        // Reset jam ke 00:00:00
        startDate.setHours(0, 0, 0, 0);
        activationDate = startDate;

        // Hitung Maturity Date (Start Date + Tenor Bulan)
        const maturity = new Date(startDate);
        maturity.setMonth(startDate.getMonth() + deposit.tenorMonths);
        maturityDate = maturity;
      }

      await this.prisma.$transaction(async (tx) => {
        // Update Approval Record saat ini
        await tx.depositApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: DepositApprovalDecision.APPROVED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        // Tentukan Status Baru
        const newStatus = isLastStep ? DepositStatus.APPROVED : deposit.status;

        // Update Aplikasi Utama
        await tx.depositApplication.update({
          where: { id: depositId },
          data: {
            status: newStatus,
            currentStep: nextStep,
            ...(isLastStep && {
              approvedAt: new Date(), // Waktu tombol diklik
              activatedAt: activationDate, // Waktu uang masuk (Tgl 27)
              maturityDate: maturityDate, // Waktu jatuh tempo
            }),
          },
        });

        // Catat History
        await tx.depositHistory.create({
          data: {
            depositApplicationId: depositId,
            status: newStatus,
            amountValue: deposit.amountValue,
            tenorMonths: deposit.tenorMonths,
            action: 'APPROVED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      if (isLastStep) {
        // Notifikasi Terakhir (Ke Payroll / User)
        try {
          await this.notifyDepositApproved(depositId);
        } catch (error) {
          console.error('Failed to send approval notifications:', error);
        }

        return {
          message: 'Deposito berhasil disetujui dan dijadwalkan aktif.',
          activationDate,
          maturityDate,
        };
      } else {
        // Notifikasi ke Approver Selanjutnya
        try {
          await this.notifyApprovers(depositId, nextStep!, 'APPROVAL_REQUEST');
        } catch (error) {
          console.error('Failed to notify next approver:', error);
        }

        return {
          message:
            'Deposito berhasil disetujui. Menunggu approval tahap selanjutnya.',
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

    // Queue bulk approval request emails
    try {
      await this.mailQueueService.queueBulkDepositApprovalRequests(
        approvers.map(a => ({ email: a.email, approverName: a.name })),
        deposit.user.name,
        deposit.depositNumber,
        deposit.amountValue.toNumber(),
        roleName,
      );
      this.logger.log(`Queued ${approvers.length} deposit approval request emails`);
    } catch (error) {
      this.logger.error('Failed to queue approval requests:', error);
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

    // Notify applicant (queued)
    try {
      await this.mailQueueService.queueDepositApproved(
        deposit.user.email,
        deposit.user.name,
        deposit.depositNumber,
        deposit.amountValue.toNumber(),
        deposit.tenorMonths,
      );
    } catch (error) {
      this.logger.error('Failed to queue applicant notification:', error);
    }

    // Notify payroll users
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
        await this.mailQueueService.queueDepositPayrollNotification(
          payroll.email,
          payroll.name,
          deposit.user.name,
          deposit.depositNumber,
          deposit.amountValue.toNumber(),
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue payroll notification for ${payroll.email}:`,
          error,
        );
      }
    }

    this.logger.log(`Queued deposit approved notifications for ${deposit.depositNumber}`);
  }
}
