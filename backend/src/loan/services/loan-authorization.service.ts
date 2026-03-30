import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus, LoanType, Prisma, SocialFundTransactionType } from '@prisma/client';
import { LoanNotificationService } from './loan-notification.service';
import { ProcessAuthorizationDto } from '../dto/process-authorization.dto';
import { BulkProcessAuthorizationDto } from '../dto/bulk-process-authorization.dto';
import { LoanInstallmentService } from './loan-installment.service';

@Injectable()
export class LoanAuthorizationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: LoanNotificationService,
    private installmentService: LoanInstallmentService,
  ) {}

  /**
   * Process authorization (Ketua)
   * Flow: PENDING_AUTHORIZATION -> DISBURSED
   */
  async processAuthorization(
    loanId: string,
    ketuaId: string,
    dto: ProcessAuthorizationDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        disbursement: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    // Only allow authorization when status is PENDING_AUTHORIZATION
    if (loan.status !== LoanStatus.PENDING_AUTHORIZATION) {
      throw new BadRequestException(
        `Pinjaman tidak dalam status menunggu otorisasi. Status saat ini: ${loan.status}`
      );
    }

    if (!loan.disbursement) {
      throw new BadRequestException('Belum ada data pencairan. Shopkeeper harus memproses pencairan terlebih dahulu.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create authorization record
      await tx.loanAuthorization.create({
        data: {
          loanApplicationId: loanId,
          authorizedBy: ketuaId,
          authorizationDate: new Date(dto.authorizationDate),
          authorizationTime: dto.authorizationTime,
          notes: dto.notes,
        },
      });

      // Update loan status to DISBURSED (final status)
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.DISBURSED,
          disbursedAt: new Date(),
        },
      });

      // Generate installment schedule
      await this.installmentService.generateInstallmentSchedule(loanId, tx);

      // EXCESS_LOAN: deduct from Social Fund
      if (loan.loanType === LoanType.EXCESS_LOAN) {
        await this.deductSocialFund(tx, loan.loanAmount, loanId, ketuaId);
      }

      // Save history
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.DISBURSED,
          loanType: loan.loanType,
          loanAmount: loan.loanAmount,
          loanTenor: loan.loanTenor,
          loanPurpose: loan.loanPurpose,
          interestRate: loan.interestRate,
          monthlyInstallment: loan.monthlyInstallment,
          action: 'AUTHORIZED_AND_DISBURSED',
          actionAt: new Date(),
          actionBy: ketuaId,
          notes: `Otorisasi dilakukan pada ${dto.authorizationDate} jam ${dto.authorizationTime}. Pinjaman telah dicairkan.`,
        },
      });

      return updated;
    });

    // Notify all relevant parties about completion
    try {
      await this.notificationService.notifyLoanCompleted(loanId);
    } catch (error) {
      console.error('Failed to send completion notifications:', error);
    }

    return {
      message: 'Pinjaman berhasil diotorisasi dan dicairkan.',
      loan: result,
    };
  }

  /**
   * Bulk process authorization
   */
  async bulkProcessAuthorization(ketuaId: string, dto: BulkProcessAuthorizationDto) {
    const results = {
      success: [] as { id: string; newStatus: LoanStatus }[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processAuthorization(loanId, ketuaId, {
          authorizationDate: dto.authorizationDate,
          authorizationTime: dto.authorizationTime,
          notes: dto.notes,
        });
        results.success.push({
          id: loanId,
          newStatus: LoanStatus.DISBURSED,
        });
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} otorisasi, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Deduct Social Fund balance when an EXCESS_LOAN is disbursed
   */
  private async deductSocialFund(
    tx: Prisma.TransactionClient,
    loanAmount: Prisma.Decimal,
    loanId: string,
    processedBy: string,
  ): Promise<void> {
    const balance = await tx.socialFundBalance.findFirst();

    if (!balance) {
      throw new BadRequestException('Saldo dana sosial belum diatur');
    }

    if (balance.currentBalance.lessThan(loanAmount)) {
      throw new BadRequestException(
        `Saldo dana sosial tidak mencukupi untuk pencairan pinjaman excess. Saldo: Rp ${balance.currentBalance.toNumber().toLocaleString('id-ID')}`,
      );
    }

    const newBalance = balance.currentBalance.sub(loanAmount);

    await tx.socialFundBalance.update({
      where: { id: balance.id },
      data: { currentBalance: newBalance, updatedBy: processedBy },
    });

    await tx.socialFundTransaction.create({
      data: {
        type: SocialFundTransactionType.EXCESS_LOAN_DISBURSEMENT,
        amount: loanAmount,
        balanceAfter: newBalance,
        description: `Pencairan Pinjaman Excess (Loan ID: ${loanId})`,
        createdBy: processedBy,
      },
    });
  }
}