import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailQueueService } from '../../mail/mail-queue.service';
import { LoanApprovalStep } from '@prisma/client';

@Injectable()
export class LoanNotificationService {
  private readonly logger = new Logger(LoanNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private mailQueueService: MailQueueService,
  ) { }

  /**
   * Notify approvers about a loan that needs approval
   * Uses bulk queue for reliable delivery to multiple recipients
   */
  async notifyApprovers(loanId: string, step: LoanApprovalStep, type: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!loan) return;

    const roleName = step === LoanApprovalStep.DIVISI_SIMPAN_PINJAM
      ? 'divisi_simpan_pinjam'
      : step === LoanApprovalStep.KETUA
        ? 'ketua'
        : 'pengawas';

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

    // Using bulk queue instead of synchronous loop
    // This ensures all emails are reliably delivered even if some fail initially
    try {
      const jobIds = await this.mailQueueService.queueBulkLoanApprovalRequests(
        approvers.map((approver) => ({
          email: approver.email,
          approverName: approver.name,
        })),
        loan.user.name,
        loan.loanNumber,
        loan.loanAmount.toNumber(),
        roleName,
      );

      this.logger.log(
        `Queued ${jobIds.length} approval request emails for loan ${loan.loanNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue approval request emails for loan ${loan.loanNumber}:`,
        error,
      );
    }
  }

  /**
   * Notify shopkeepers about a loan ready for disbursement
   */
  async notifyShopkeepers(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) return;

    const shopkeepers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: 'shopkeeper',
            },
          },
        },
      },
    });

    // Queue all shopkeeper notifications
    for (const shopkeeper of shopkeepers) {
      try {
        await this.mailQueueService.queueLoanDisbursementRequest(
          shopkeeper.email,
          shopkeeper.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
          loan.bankAccountNumber,
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue disbursement request for ${shopkeeper.email}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${shopkeepers.length} disbursement notification emails for loan ${loan.loanNumber}`,
    );
  }

  /**
   * Notify ketua for authorization after disbursement
   */
  async notifyKetuaForAuthorization(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        disbursement: true,
      },
    });

    if (!loan) return;

    const ketuas = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: 'ketua',
            },
          },
        },
      },
    });

    // Queue all ketua notifications
    for (const ketua of ketuas) {
      try {
        await this.mailQueueService.queueLoanAuthorizationRequest(
          ketua.email,
          ketua.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue authorization request for ${ketua.email}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${ketuas.length} authorization notification emails for loan ${loan.loanNumber}`,
    );
  }

  /**
   * Notify all relevant parties when loan is completed
   */
  async notifyLoanCompleted(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: {
          include: {
            approver: true,
          },
        },
        disbursement: {
          include: {
            processedByUser: true,
          },
        },
        authorization: {
          include: {
            authorizedByUser: true,
          },
        },
      },
    });

    if (!loan) return;

    // Notify applicant first (priority)
    try {
      await this.mailQueueService.queueLoanDisbursed(
        loan.user.email,
        loan.user.name,
        loan.loanNumber,
        loan.loanAmount.toNumber(),
        loan.bankAccountNumber,
      );
      this.logger.log(`Queued disbursed notification for applicant ${loan.user.email}`);
    } catch (error) {
      this.logger.error('Failed to queue applicant notification:', error);
    }

    // Collect unique approvers and processors
    const notifyUsers = new Map<string, string>(); // email -> name

    loan.approvals.forEach((a) => {
      if (a.approver) {
        notifyUsers.set(a.approver.email, a.approver.name);
      }
    });

    if (loan.disbursement?.processedByUser) {
      notifyUsers.set(
        loan.disbursement.processedByUser.email,
        loan.disbursement.processedByUser.name,
      );
    }

    // Queue completion notifications
    for (const [email] of notifyUsers) {
      try {
        await this.mailQueueService.queueLoanCompletionNotification(
          email,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue completion notification for ${email}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Queued ${notifyUsers.size} completion notification emails for loan ${loan.loanNumber}`,
    );
  }
}