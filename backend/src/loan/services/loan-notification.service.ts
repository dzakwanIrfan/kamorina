import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { LoanApprovalStep } from '@prisma/client';

@Injectable()
export class LoanNotificationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

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

    for (const approver of approvers) {
      try {
        await this.mailService.sendLoanApprovalRequest(
          approver.email,
          approver.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
          roleName,
        );
      } catch (error) {
        console.error(`Failed to send approval request to ${approver.email}:`, error);
      }
    }
  }

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

    for (const shopkeeper of shopkeepers) {
      try {
        await this.mailService.sendLoanDisbursementRequest(
          shopkeeper.email,
          shopkeeper.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
          loan.bankAccountNumber,
        );
      } catch (error) {
        console.error(`Failed to send disbursement request to ${shopkeeper.email}:`, error);
      }
    }
  }

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

    for (const ketua of ketuas) {
      try {
        await this.mailService.sendLoanAuthorizationRequest(
          ketua.email,
          ketua.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send authorization request to ${ketua.email}:`, error);
      }
    }
  }

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

    // Notify applicant
    try {
      await this.mailService.sendLoanDisbursed(
        loan.user.email,
        loan.user.name,
        loan.loanNumber,
        loan.loanAmount.toNumber(),
        loan.bankAccountNumber,
      );
    } catch (error) {
      console.error('Failed to notify applicant:', error);
    }

    // Notify all approvers and processors
    const notifyUsers = new Set<string>();

    loan.approvals.forEach((a) => {
      if (a.approver) notifyUsers.add(a.approver.email);
    });

    if (loan.disbursement?.processedByUser) {
      notifyUsers.add(loan.disbursement.processedByUser.email);
    }

    for (const email of notifyUsers) {
      try {
        await this.mailService.sendLoanCompletionNotification(
          email,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send completion notification to ${email}:`, error);
      }
    }
  }
}