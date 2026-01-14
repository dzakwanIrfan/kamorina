import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailQueueService } from '../../mail/mail-queue.service';
import { RepaymentApprovalStep } from '@prisma/client';

@Injectable()
export class RepaymentNotificationService {
  private readonly logger = new Logger(RepaymentNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private mailQueueService: MailQueueService,
  ) {}

  /**
   * Notify approvers about a repayment that needs approval
   */
  async notifyApprovers(repaymentId: string, step: RepaymentApprovalStep) {
    const repayment = await this.prisma.loanRepayment.findUnique({
      where: { id: repaymentId },
      include: {
        loanApplication: {
          include: {
            user: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });

    if (!repayment) return;

    const roleName =
      step === RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM
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

    const roleLabel =
      roleName === 'divisi_simpan_pinjam' ? 'Divisi Simpan Pinjam' : 'Ketua';

    // Queue all approver notifications
    for (const approver of approvers) {
      try {
        await this.mailQueueService.queueGenericEmail(
          approver.email,
          `Pengajuan Pelunasan Menunggu Persetujuan - ${repayment.repaymentNumber}`,
          `
            <h2>Halo ${approver.name},</h2>
            <p>Ada pengajuan pelunasan pinjaman yang menunggu persetujuan Anda.</p>
            <br>
            <h3>Detail Pelunasan:</h3>
            <ul>
              <li><strong>Nomor Pelunasan:</strong> ${repayment.repaymentNumber}</li>
              <li><strong>Nomor Pinjaman:</strong> ${repayment.loanApplication.loanNumber}</li>
              <li><strong>Pemohon:</strong> ${repayment.loanApplication.user.employee.fullName}</li>
              <li><strong>Jumlah Pelunasan:</strong> Rp ${Number(repayment.totalAmount).toLocaleString('id-ID')}</li>
            </ul>
            <br>
            <p>Sebagai <strong>${roleLabel}</strong>, Anda diminta untuk meninjau dan menyetujui/menolak pengajuan ini.</p>
            <br>
            <p>Silakan akses dashboard untuk memproses pengajuan ini.</p>
          `,
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue approval request for ${approver.email}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${approvers.length} approval notification emails for repayment ${repayment.repaymentNumber}`,
    );
  }
}
