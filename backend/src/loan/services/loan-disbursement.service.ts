import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';
import { LoanNotificationService } from './loan-notification.service';
import { ProcessDisbursementDto } from '../dto/process-disbursement.dto';
import { BulkProcessDisbursementDto } from '../dto/bulk-process-disbursement.dto';

@Injectable()
export class LoanDisbursementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: LoanNotificationService,
  ) {}

  /**
   * Process disbursement (Shopkeeper)
   * Flow: APPROVED_PENDING_DISBURSEMENT -> DISBURSEMENT_IN_PROGRESS -> (wait for authorization)
   */
  async processDisbursement(
    loanId: string,
    shopkeeperId: string,
    dto: ProcessDisbursementDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.status !== LoanStatus.APPROVED_PENDING_DISBURSEMENT) {
      throw new BadRequestException(
        `Pinjaman tidak dalam status menunggu pencairan. Status saat ini: ${loan.status}`
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create disbursement record
      await tx.loanDisbursement.create({
        data: {
          loanApplicationId: loanId,
          processedBy: shopkeeperId,
          disbursementDate: new Date(dto.disbursementDate),
          disbursementTime: dto.disbursementTime,
          notes: dto.notes,
        },
      });

      // Update status to PENDING_AUTHORIZATION (waiting for Ketua to authorize)
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.PENDING_AUTHORIZATION,
        },
      });

      // Save history
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.PENDING_AUTHORIZATION,
          loanType: loan.loanType,
          loanAmount: loan.loanAmount,
          loanTenor: loan.loanTenor,
          loanPurpose: loan.loanPurpose,
          interestRate: loan.interestRate,
          monthlyInstallment: loan.monthlyInstallment,
          action: 'DISBURSEMENT_CREATED',
          actionAt: new Date(),
          actionBy: shopkeeperId,
          notes: `Transaksi BCA dibuat pada ${dto.disbursementDate} jam ${dto.disbursementTime}. Menunggu otorisasi dari Ketua.`,
        },
      });

      return updated;
    });

    // Notify Ketua for authorization
    try {
      await this.notificationService.notifyKetuaForAuthorization(loanId);
    } catch (error) {
      console.error('Failed to notify ketua:', error);
    }

    return {
      message: 'Transaksi pencairan berhasil dicatat. Menunggu otorisasi dari Ketua.',
      loan: result,
    };
  }

  /**
   * Bulk process disbursement
   */
  async bulkProcessDisbursement(shopkeeperId: string, dto: BulkProcessDisbursementDto) {
    const results = {
      success: [] as { id: string; newStatus: LoanStatus }[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        const result = await this.processDisbursement(loanId, shopkeeperId, {
          disbursementDate: dto.disbursementDate,
          disbursementTime: dto.disbursementTime,
          notes: dto.notes,
        });
        results.success.push({
          id: loanId,
          newStatus: LoanStatus.PENDING_AUTHORIZATION,
        });
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} pencairan, ${results.failed.length} gagal`,
      results,
    };
  }
}