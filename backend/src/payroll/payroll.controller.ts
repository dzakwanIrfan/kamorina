import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { ManualPayrollDto, PayrollPeriodQueryDto } from './dto/payroll.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Trigger manual payroll processing' })
  @ApiResponse({ status: 200, description: 'Payroll processed successfully' })
  @ApiResponse({ status: 400, description: 'Payroll already processed' })
  async triggerPayroll(@Body() dto: ManualPayrollDto) {
    const result = await this.payrollService.triggerManualPayroll(dto);

    return {
      success: true,
      message: 'Payroll processed successfully',
      data: {
        periodId: result.periodId,
        periodName: result.periodName,
        processedAt: result.processedAt,
        summary: {
          membership: {
            count: result.membership.processedCount,
            total: result.membership.totalAmount.toString(),
            errors: result.membership.errors.length,
          },
          mandatorySavings: {
            count: result.mandatorySavings.processedCount,
            total: result.mandatorySavings.totalAmount.toString(),
            errors: result.mandatorySavings.errors.length,
          },
          depositSavings: {
            count: result.depositSavings.processedCount,
            total: result.depositSavings.totalAmount.toString(),
            errors: result.depositSavings.errors.length,
          },
          loanInstallments: {
            count: result.loanInstallments.processedCount,
            total: result.loanInstallments.totalAmount.toString(),
            errors: result.loanInstallments.errors.length,
          },
          interest: {
            count: result.interest.processedCount,
            total: result.interest.totalAmount.toString(),
            errors: result.interest.errors.length,
          },
          grandTotal: result.grandTotal.toString(),
        },
      },
    };
  }

  @Get('status')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam', 'bendahara')
  @ApiOperation({ summary: 'Get payroll status for a period' })
  async getStatus(@Query() query: PayrollPeriodQueryDto) {
    const month = query.month || new Date().getMonth() + 1;
    const year = query.year || new Date().getFullYear();

    const status = await this.payrollService.getPayrollStatus(month, year);

    if (!status) {
      return {
        success: true,
        message: 'No payroll period found',
        data: null,
      };
    }

    return {
      success: true,
      data: status,
    };
  }

  @Get('history')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam', 'bendahara')
  @ApiOperation({ summary: 'Get payroll processing history' })
  async getHistory(@Query() query: PayrollPeriodQueryDto) {
    const history = await this.payrollService.getPayrollHistory(
      query.limit || 12,
    );

    return {
      success: true,
      data: history,
    };
  }

  @Get('period/:periodId/transactions')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam', 'bendahara')
  @ApiOperation({ summary: 'Get transactions for a specific payroll period' })
  async getPeriodTransactions(@Param('periodId') periodId: string) {
    const transactions =
      await this.payrollService.getPeriodTransactions(periodId);

    return {
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        user: {
          id: t.account.user.id,
          name: t.account.user.name,
          employeeNumber: t.account.user.employee?.employeeNumber,
          department: t.account.user.employee?.department?.departmentName,
        },
        iuranPendaftaran: t.iuranPendaftaran.toString(),
        iuranBulanan: t.iuranBulanan.toString(),
        tabunganDeposito: t.tabunganDeposito.toString(),
        bunga: t.bunga.toString(),
        shu: t.shu.toString(),
        penarikan: t.penarikan.toString(),
        transactionDate: t.transactionDate,
      })),
    };
  }

  @Get('preview')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Preview payroll before processing (dry run)' })
  async previewPayroll(@Query() query: PayrollPeriodQueryDto) {
    // This would be a dry-run implementation
    // For now, just return the current pending items

    const month = query.month || new Date().getMonth() + 1;
    const year = query.year || new Date().getFullYear();

    // Get pending items count
    const pendingMemberships = await this.prisma.memberApplication.count({
      where: {
        status: 'APPROVED',
        isPaidOff: false,
      },
    });

    const activeMembers = await this.prisma.user.count({
      where: {
        memberVerified: true,
        savingsAccount: { isNot: null },
      },
    });

    const activeDeposits = await this.prisma.depositApplication.count({
      where: {
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
    });

    const activeLoans = await this.prisma.loanApplication.count({
      where: {
        status: 'DISBURSED',
      },
    });

    return {
      success: true,
      data: {
        period: `${month}/${year}`,
        preview: {
          pendingMembershipFees: pendingMemberships,
          activeMembersForMandatorySavings: activeMembers,
          activeDeposits: activeDeposits,
          activeLoans: activeLoans,
        },
      },
    };
  }

  // Inject prisma for preview endpoint
  private get prisma() {
    return (this.payrollService as any).prisma;
  }
}
