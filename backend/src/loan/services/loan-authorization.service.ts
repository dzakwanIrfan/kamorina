import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';
import { LoanNotificationService } from './loan-notification.service';
import { ProcessAuthorizationDto } from '../dto/process-authorization.dto';
import { BulkProcessAuthorizationDto } from '../dto/bulk-process-authorization.dto';

@Injectable()
export class LoanAuthorizationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: LoanNotificationService,
  ) {}

  /**
   * Process authorization (Ketua)
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

    if (loan.status !== LoanStatus.DISBURSEMENT_IN_PROGRESS && 
        loan.status !== LoanStatus.PENDING_AUTHORIZATION) {
      throw new BadRequestException('Pinjaman tidak dalam status menunggu otorisasi');
    }

    if (!loan.disbursement) {
      throw new BadRequestException('Belum ada data pencairan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.loanAuthorization.create({
        data: {
          loanApplicationId: loanId,
          authorizedBy: ketuaId,
          authorizationDate: new Date(dto.authorizationDate),
          authorizationTime: dto.authorizationTime,
          notes: dto.notes,
        },
      });

      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.DISBURSED,
          disbursedAt: new Date(),
        },
      });

      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.DISBURSED,
          loanType: loan.loanType,
          loanAmount: loan.loanAmount,
          loanTenor: loan.loanTenor,
          loanPurpose: loan.loanPurpose,
          bankAccountNumber: loan.bankAccountNumber,
          interestRate: loan.interestRate,
          monthlyInstallment: loan.monthlyInstallment,
          action: 'DISBURSED',
          actionAt: new Date(),
          actionBy: ketuaId,
          notes: `Otorisasi dilakukan pada ${dto.authorizationDate} jam ${dto.authorizationTime}`,
        },
      });

      return updated;
    });

    // Notify all relevant parties
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
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processAuthorization(loanId, ketuaId, {
          authorizationDate: dto.authorizationDate,
          authorizationTime: dto.authorizationTime,
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
      message: `Berhasil memproses ${results.success.length} otorisasi, ${results.failed.length} gagal`,
      results,
    };
  }
}