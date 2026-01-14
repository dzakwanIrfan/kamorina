import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailQueueService } from '../../mail/mail-queue.service';
import {
  RepaymentStatus,
  RepaymentApprovalStep,
  ApprovalDecision,
  LoanStatus,
  RepaymentApproval,
} from '@prisma/client';
import { ApproveRepaymentDto } from '../dto/approve-repayment.dto';
import { BulkApproveRepaymentDto } from '../dto/bulk-approve-repayment.dto';
import { RepaymentNotificationService } from './repayment-notification.service';

@Injectable()
export class RepaymentApprovalService {
  private readonly logger = new Logger(RepaymentApprovalService.name);

  constructor(
    private prisma: PrismaService,
    private mailQueueService: MailQueueService,
    private notificationService: RepaymentNotificationService,
  ) {}

  /**
   * Get status for current approval step
   */
  private getStatusForStep(step: RepaymentApprovalStep): RepaymentStatus {
    const stepStatusMap: Record<RepaymentApprovalStep, RepaymentStatus> = {
      [RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM]: RepaymentStatus.UNDER_REVIEW_DSP,
      [RepaymentApprovalStep.KETUA]: RepaymentStatus.UNDER_REVIEW_KETUA,
    };
    return stepStatusMap[step];
  }

  /**
   * Get next step after current step
   */
  private getNextStep(
    currentStep: RepaymentApprovalStep,
  ): RepaymentApprovalStep | null {
    const stepOrder: RepaymentApprovalStep[] = [
      RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
      RepaymentApprovalStep.KETUA,
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1
      ? stepOrder[currentIndex + 1]
      : null;
  }

  /**
   * Check if current step is the last approval step
   */
  private isLastStep(currentStep: RepaymentApprovalStep): boolean {
    return currentStep === RepaymentApprovalStep.KETUA;
  }

  /**
   * Get step name for display
   */
  private getStepDisplayName(step: RepaymentApprovalStep): string {
    const stepNames: Record<RepaymentApprovalStep, string> = {
      [RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
      [RepaymentApprovalStep.KETUA]: 'Ketua',
    };
    return stepNames[step];
  }

  /**
   * Process approval
   */
  async processApproval(
    repaymentId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveRepaymentDto,
  ) {
    const repayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repaymentId },
      include: {
        loanApplication: {
          include: {
            user: true,
          },
        },
        approvals: true,
      },
    });

    if (!repayment) {
      throw new NotFoundException('Pelunasan tidak ditemukan');
    }

    if (!repayment.currentStep) {
      throw new BadRequestException('Pelunasan tidak dalam status review');
    }

    // Map role to step
    const roleStepMap: Record<string, RepaymentApprovalStep> = {
      divisi_simpan_pinjam: RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: RepaymentApprovalStep.KETUA,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === repayment.currentStep);

    if (!approverStep) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk approve di step ini',
      );
    }

    // Validate current status matches expected status for this step
    const expectedStatus = this.getStatusForStep(repayment.currentStep);
    if (repayment.status !== expectedStatus) {
      throw new BadRequestException(
        `Status pelunasan tidak sesuai. Expected: ${expectedStatus}, Got: ${repayment.status}`,
      );
    }

    const approvalRecord = repayment.approvals.find(
      (a) => a.step === repayment.currentStep,
    );
    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    if (dto.decision === ApprovalDecision.REJECTED) {
      return this.processRejection(repayment, approvalRecord, approverId, dto);
    } else {
      return this.processApprovalDecision(
        repayment,
        approvalRecord,
        approverId,
        dto,
      );
    }
  }

  /**
   * Process rejection
   */
  private async processRejection(
    repayment: any,
    approvalRecord: any,
    approverId: string,
    dto: ApproveRepaymentDto,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.repaymentApproval.update({
        where: { id: approvalRecord.id },
        data: {
          decision: ApprovalDecision.REJECTED,
          decidedAt: new Date(),
          approverId,
          notes: dto.notes,
        },
      });

      await tx.loanRepayment.update({
        where: { id: repayment.id },
        data: {
          status: RepaymentStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: dto.notes,
          currentStep: null,
        },
      });
    });

    // Notify applicant (queued)
    try {
      await this.mailQueueService.queueGenericEmail(
        repayment.loanApplication.user.email,
        'Pengajuan Pelunasan Ditolak - Koperasi Kamorina',
        `
          <h2>Halo ${repayment.loanApplication.user.name},</h2>
          <p>Pengajuan pelunasan pinjaman Anda dengan nomor <strong>${repayment.repaymentNumber}</strong> telah <strong>DITOLAK</strong>.</p>
          <br>
          <h3>Alasan Penolakan:</h3>
          <p>${dto.notes || 'Tidak ada catatan'}</p>
          <br>
          <p>Jika Anda memiliki pertanyaan, silakan hubungi Divisi Simpan Pinjam. </p>
        `,
      );
    } catch (error) {
      this.logger.error('Failed to queue rejection email:', error);
    }

    return {
      message: `Pelunasan berhasil ditolak oleh ${this.getStepDisplayName(repayment.currentStep)}`,
    };
  }

  /**
   * Process approval decision
   */
  private async processApprovalDecision(
    repayment: any,
    approvalRecord: RepaymentApproval,
    approverId: string,
    dto: ApproveRepaymentDto,
  ) {
    const currentStep = repayment.currentStep as RepaymentApprovalStep;
    const isLast = this.isLastStep(currentStep);
    const nextStep = this.getNextStep(currentStep);

    // Determine new status
    let newStatus: RepaymentStatus;
    if (isLast) {
      newStatus = RepaymentStatus.APPROVED;
    } else if (nextStep) {
      newStatus = this.getStatusForStep(nextStep);
    } else {
      newStatus = repayment.status;
    }

    await this.prisma.$transaction(async (tx) => {
      // Update approval record
      await tx.repaymentApproval.update({
        where: { id: approvalRecord.id },
        data: {
          decision: ApprovalDecision.APPROVED,
          decidedAt: new Date(),
          approverId,
          notes: dto.notes,
        },
      });

      // Update repayment status
      await tx.loanRepayment.update({
        where: { id: repayment.id },
        data: {
          status: newStatus,
          currentStep: nextStep,
          ...(isLast && { approvedAt: new Date() }),
        },
      });
    });

    if (isLast) {
      // All approvals complete, notify applicant
      try {
        await this.mailQueueService.queueGenericEmail(
          repayment.loanApplication.user.email,
          'Pelunasan Pinjaman Disetujui - Koperasi Kamorina',
          `
            <h2>Selamat ${repayment.loanApplication.user.name},</h2>
            <p>Pengajuan pelunasan pinjaman Anda dengan nomor <strong>${repayment.repaymentNumber}</strong> telah <strong>DISETUJUI</strong>.</p>
            <br>
            <p>Pinjaman Anda dengan nomor <strong>${repayment.loanApplication.loanNumber}</strong> telah dinyatakan <strong>LUNAS</strong>.</p>
            <br>
            <p>Terima kasih telah menggunakan layanan koperasi. </p>
          `,
        );
      } catch (error) {
        this.logger.error('Failed to send approval notification:', error);
      }

      return {
        message:
          'Pelunasan berhasil disetujui.  Pinjaman telah dinyatakan lunas.',
        newStatus: newStatus,
      };
    } else {
      // Notify next approver
      try {
        await this.notificationService.notifyApprovers(repayment.id, nextStep!);
      } catch (error) {
        this.logger.error('Failed to notify next approver:', error);
      }

      const nextStepName = this.getStepDisplayName(nextStep!);
      return {
        message: `Pelunasan berhasil disetujui oleh ${this.getStepDisplayName(currentStep)}. Menunggu approval dari ${nextStepName}. `,
        newStatus: newStatus,
        nextStep: nextStep,
      };
    }
  }

  /**
   * Bulk approve/reject
   */
  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveRepaymentDto,
  ) {
    const results = {
      success: [] as { id: string; newStatus: RepaymentStatus }[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const repaymentId of dto.repaymentIds) {
      try {
        const result = await this.processApproval(
          repaymentId,
          approverId,
          approverRoles,
          {
            decision: dto.decision,
            notes: dto.notes,
          },
        );
        results.success.push({
          id: repaymentId,
          newStatus: (result as any).newStatus || RepaymentStatus.REJECTED,
        });
      } catch (error) {
        results.failed.push({
          id: repaymentId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} pelunasan, ${results.failed.length} gagal`,
      results,
    };
  }
}
