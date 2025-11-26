import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { LoanStatus, LoanApprovalStep, LoanApprovalDecision, LoanType } from '@prisma/client';
import { LoanHandlerFactory } from '../handlers/loan-handler.factory';
import { LoanCalculationService } from './loan-calculation.service';
import { LoanValidationService } from './loan-validation.service';
import { LoanNotificationService } from './loan-notification.service';
import { ApproveLoanDto } from '../dto/approve-loan.dto';
import { BulkApproveLoanDto } from '../dto/bulk-approve-loan.dto';
import { ReviseLoanDto } from '../dto/revise-loan.dto';

@Injectable()
export class LoanApprovalService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private loanHandlerFactory: LoanHandlerFactory,
    private calculationService: LoanCalculationService,
    private validationService: LoanValidationService,
    private notificationService: LoanNotificationService,
  ) {}

  /**
   * Revise loan (DSP only)
   */
  async reviseLoan(loanId: string, approverId: string, dto: ReviseLoanDto) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.currentStep !== LoanApprovalStep.DIVISI_SIMPAN_PINJAM) {
      throw new BadRequestException('Hanya bisa direvisi pada step DSP');
    }

    const handler = this.loanHandlerFactory.getHandler(loan.loanType);

    // Extract new loan amount based on type
    let newLoanAmount: number;
    switch (loan.loanType) {
      case LoanType.CASH_LOAN:
        newLoanAmount = (dto as any).loanAmount;
        break;
      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_ONLINE:
        newLoanAmount = (dto as any).itemPrice;
        break;
      case LoanType.GOODS_PHONE:
        newLoanAmount = (dto as any).cooperativePrice;
        break;
      default:
        throw new BadRequestException('Tipe pinjaman tidak valid');
    }

    await handler.validateLoanAmount(loan.userId, newLoanAmount);
    await this.validationService.validateLoanTenor(dto.loanTenor);
    const calculations = await this.calculationService.calculateLoanDetails(
      newLoanAmount, 
      dto.loanTenor,
      loan.loanType
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // Update loan
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          loanAmount: newLoanAmount,
          loanTenor: dto.loanTenor,
          interestRate: calculations.interestRate,
          monthlyInstallment: calculations.monthlyInstallment,
          totalRepayment: calculations.totalRepayment,
          revisionCount: { increment: 1 },
          lastRevisedAt: new Date(),
          lastRevisedBy: approverId,
          revisionNotes: dto.revisionNotes,
        },
      });

      // Update type-specific details (pass shopMarginRate for GOODS_ONLINE)
      await handler.reviseTypeSpecificDetails(tx, loanId, dto, calculations.shopMarginRate);

      // Save revision in approval record
      const approvalRecord = loan.approvals.find(
        (a) => a.step === LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
      );

      if (approvalRecord) {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.REVISED,
            decidedAt: new Date(),
            approverId,
            notes: dto.revisionNotes,
            revisedData: {
              loanAmount: newLoanAmount,
              loanTenor: dto.loanTenor,
              interestRate: calculations.interestRate,
              monthlyInstallment: calculations.monthlyInstallment,
              totalRepayment: calculations.totalRepayment,
              shopMarginRate: calculations.shopMarginRate,
              typeSpecificData: { ...dto },
            },
          },
        });
      }

      // Save history
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: loan.status,
          loanType: loan.loanType,
          loanAmount: newLoanAmount,
          loanTenor: dto.loanTenor,
          loanPurpose: loan.loanPurpose,
          bankAccountNumber: loan.bankAccountNumber,
          interestRate: calculations.interestRate,
          monthlyInstallment: calculations.monthlyInstallment,
          action: 'REVISED',
          actionAt: new Date(),
          actionBy: approverId,
          notes: dto.revisionNotes,
        },
      });

      return updated;
    });

    // Notify applicant about revision
    try {
      await this.mailService.sendLoanRevised(
        loan.user.email,
        loan.user.name,
        loan.loanNumber,
        dto.revisionNotes,
      );
    } catch (error) {
      console.error('Failed to send revision notification:', error);
    }

    return {
      message: 'Pinjaman berhasil direvisi',
      loan: result,
    };
  }

  /**
   * Process approval (DSP, Ketua, Pengawas)
   */
  async processApproval(
    loanId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveLoanDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (!loan.currentStep) {
      throw new BadRequestException('Pinjaman tidak dalam status review');
    }

    // Map role to step
    const roleStepMap: { [key: string]: LoanApprovalStep } = {
      divisi_simpan_pinjam: LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: LoanApprovalStep.KETUA,
      pengawas: LoanApprovalStep.PENGAWAS,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === loan.currentStep);

    if (!approverStep) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk approve di step ini');
    }

    const approvalRecord = loan.approvals.find((a) => a.step === loan.currentStep);
    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision && approvalRecord.decision !== LoanApprovalDecision.REVISED) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    if (dto.decision === LoanApprovalDecision.REJECTED) {
      // REJECT
      await this.prisma.$transaction(async (tx) => {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.REJECTED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        await tx.loanApplication.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.REJECTED,
            rejectedAt: new Date(),
            rejectionReason: dto.notes,
            currentStep: null,
          },
        });

        await tx.loanHistory.create({
          data: {
            loanApplicationId: loanId,
            status: LoanStatus.REJECTED,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            loanTenor: loan.loanTenor,
            loanPurpose: loan.loanPurpose,
            bankAccountNumber: loan.bankAccountNumber,
            interestRate: loan.interestRate,
            monthlyInstallment: loan.monthlyInstallment,
            action: 'REJECTED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      // Notify applicant
      try {
        await this.mailService.sendLoanRejected(
          loan.user.email,
          loan.user.name,
          loan.loanNumber,
          dto.notes || 'Tidak ada catatan',
        );
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }

      return { message: 'Pinjaman berhasil ditolak' };
    } else {
      // APPROVE
      const stepOrder = [
        LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
        LoanApprovalStep.KETUA,
        LoanApprovalStep.PENGAWAS,
      ];

      const currentIndex = stepOrder.indexOf(loan.currentStep);
      const isLastStep = currentIndex === stepOrder.length - 1;
      const nextStep = isLastStep ? null : stepOrder[currentIndex + 1];

      await this.prisma.$transaction(async (tx) => {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.APPROVED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        const newStatus = isLastStep
          ? LoanStatus.APPROVED_PENDING_DISBURSEMENT
          : loan.status;

        await tx.loanApplication.update({
          where: { id: loanId },
          data: {
            status: newStatus,
            currentStep: nextStep,
            ...(isLastStep && { approvedAt: new Date() }),
          },
        });

        await tx.loanHistory.create({
          data: {
            loanApplicationId: loanId,
            status: newStatus,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            loanTenor: loan.loanTenor,
            loanPurpose: loan.loanPurpose,
            bankAccountNumber: loan.bankAccountNumber,
            interestRate: loan.interestRate,
            monthlyInstallment: loan.monthlyInstallment,
            action: 'APPROVED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      if (isLastStep) {
        // Notify shopkeeper for disbursement
        try {
          await this.notificationService.notifyShopkeepers(loanId);
        } catch (error) {
          console.error('Failed to notify shopkeepers:', error);
        }

        return {
          message: 'Pinjaman berhasil disetujui. Menunggu proses pencairan oleh Shopkeeper.',
        };
      } else {
        // Notify next approver
        try {
          await this.notificationService.notifyApprovers(loanId, nextStep!, 'APPROVAL_REQUEST');
        } catch (error) {
          console.error('Failed to notify next approver:', error);
        }

        const nextStepName = nextStep === LoanApprovalStep.KETUA ? 'Ketua' : 'Pengawas';
        return {
          message: `Pinjaman berhasil disetujui. Menunggu approval dari ${nextStepName}.`,
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
    dto: BulkApproveLoanDto,
  ) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processApproval(loanId, approverId, approverRoles, {
          decision: dto.decision,
          notes: dto.notes,
        });
        results.success.push(loanId);
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} pinjaman, ${results.failed.length} gagal`,
      results,
    };
  }
}