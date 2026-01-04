import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, LoanApprovalStep, LoanType } from '@prisma/client';
import { LoanHandlerFactory } from '../handlers/loan-handler.factory';
import { LoanValidationService } from './loan-validation.service';
import { LoanNotificationService } from './loan-notification.service';

@Injectable()
export class LoanSubmissionService {
  constructor(
    private prisma: PrismaService,
    private loanHandlerFactory: LoanHandlerFactory,
    private validationService: LoanValidationService,
    private notificationService: LoanNotificationService,
  ) {}

  /**
   * Submit loan application
   * Flow: DRAFT -> SUBMITTED -> UNDER_REVIEW_DSP
   */
  async submitLoan(userId: string, loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa disubmit');
    }

    const handler = this.loanHandlerFactory.getHandler(loan.loanType);

    // Re-validate before submit (skip for GOODS_PHONE)
    if (loan.loanType !== LoanType.GOODS_PHONE) {
      await handler.validateLoanAmount(userId, loan.loanAmount.toNumber());
    }
    await this.validationService.validateLoanTenor(loan.loanTenor);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update loan status to UNDER_REVIEW_DSP (not just SUBMITTED)
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.UNDER_REVIEW_DSP, // Langsung ke UNDER_REVIEW_DSP
          currentStep: LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
          submittedAt: new Date(),
        },
      });

      // Create approval records
      await tx.loanApproval.createMany({
        data: [
          { loanApplicationId: loanId, step: LoanApprovalStep.DIVISI_SIMPAN_PINJAM },
          { loanApplicationId: loanId, step: LoanApprovalStep.KETUA },
          { loanApplicationId: loanId, step: LoanApprovalStep.PENGAWAS },
        ],
      });

      // Save history for submission
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.SUBMITTED,
          loanType: loan.loanType,
          loanAmount: updated.loanAmount,
          loanTenor: updated.loanTenor,
          loanPurpose: updated.loanPurpose,
          interestRate: updated.interestRate,
          monthlyInstallment: updated.monthlyInstallment,
          action: 'SUBMITTED',
          actionAt: new Date(),
          actionBy: userId,
        },
      });

      // Save history for status change to UNDER_REVIEW_DSP
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.UNDER_REVIEW_DSP,
          loanType: loan.loanType,
          loanAmount: updated.loanAmount,
          loanTenor: updated.loanTenor,
          loanPurpose: updated.loanPurpose,
          interestRate: updated.interestRate,
          monthlyInstallment: updated.monthlyInstallment,
          action: 'STATUS_CHANGED',
          actionAt: new Date(),
          actionBy: userId,
          notes: 'Pinjaman masuk ke review Divisi Simpan Pinjam',
        },
      });

      return updated;
    });

    // Notify DSP
    try {
      await this.notificationService.notifyApprovers(loanId, LoanApprovalStep.DIVISI_SIMPAN_PINJAM, 'NEW_LOAN');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      message: 'Pengajuan pinjaman berhasil disubmit. Menunggu review dari Divisi Simpan Pinjam.',
      loan: result,
    };
  }
}