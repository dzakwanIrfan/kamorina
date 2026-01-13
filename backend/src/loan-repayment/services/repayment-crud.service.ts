import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RepaymentStatus, RepaymentApprovalStep } from '@prisma/client';
import { CreateRepaymentDto } from '../dto/create-repayment.dto';
import { RepaymentNumberService } from './repayment-number.service';
import { RepaymentCalculationService } from './repayment-calculation.service';
import { RepaymentValidationService } from './repayment-validation.service';
import { RepaymentNotificationService } from './repayment-notification.service';

@Injectable()
export class RepaymentCrudService {
  constructor(
    private prisma: PrismaService,
    private numberService: RepaymentNumberService,
    private calculationService: RepaymentCalculationService,
    private validationService: RepaymentValidationService,
    private notificationService: RepaymentNotificationService,
  ) {}

  /**
   * Create repayment request
   */
  async createRepayment(userId: string, dto: CreateRepaymentDto) {
    // Validate ownership
    await this.validationService.validateLoanOwnership(
      userId,
      dto.loanApplicationId,
    );

    // Validate agreement
    this.validationService.validateMemberAgreement(dto.isAgreedByMember);

    // Validate eligibility
    await this.calculationService.validateRepaymentEligibility(
      dto.loanApplicationId,
    );

    // Calculate repayment amount
    const calculation = await this.calculationService.calculateRepaymentAmount(
      dto.loanApplicationId,
    );

    // Generate repayment number
    const repaymentNumber = await this.numberService.generateRepaymentNumber();

    // Create repayment
    const repayment = await this.prisma.$transaction(async (tx) => {
      // Create repayment record
      const newRepayment = await tx.loanRepayment.create({
        data: {
          repaymentNumber,
          loanApplicationId: dto.loanApplicationId,
          userId,
          totalAmount: calculation.remainingAmount,
          status: RepaymentStatus.UNDER_REVIEW_DSP,
          currentStep: RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
          isAgreedByMember: dto.isAgreedByMember,
          agreedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      // Create approval records
      await tx.repaymentApproval.createMany({
        data: [
          {
            repaymentId: newRepayment.id,
            step: RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
          },
          {
            repaymentId: newRepayment.id,
            step: RepaymentApprovalStep.KETUA,
          },
        ],
      });

      return newRepayment;
    });

    // Get complete repayment with relations
    const completeRepayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repayment.id },
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
        },
      },
    });

    // Notify DSP
    try {
      await this.notificationService.notifyApprovers(
        repayment.id,
        RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      message:
        'Pengajuan pelunasan berhasil dibuat.  Menunggu review dari Divisi Simpan Pinjam.',
      repayment: completeRepayment,
      calculation,
    };
  }

  /**
   * Get repayment by ID
   */
  async getRepaymentById(repaymentId: string, userId?: string) {
    const repayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repaymentId },
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
            loanInstallments: {
              orderBy: { installmentNumber: 'asc' },
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
    });

    if (!repayment) {
      throw new Error('Pelunasan tidak ditemukan');
    }

    // If userId provided, check access
    if (userId && repayment.userId !== userId) {
      throw new Error('Anda tidak memiliki akses ke pelunasan ini');
    }

    // Calculate details
    const calculation = await this.calculationService.calculateRepaymentAmount(
      repayment.loanApplicationId,
    );

    return {
      ...repayment,
      calculation,
    };
  }
}
