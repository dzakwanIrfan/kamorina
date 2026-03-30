import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { LoanBalanceReportService } from './loan-balance-report.service';
import { QueryLoanBalanceReportDto } from './dto/query-loan-balance-report.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Loan Balance Report')
@Controller('loan-balance-report')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LoanBalanceReportController {
  constructor(
    private readonly reportService: LoanBalanceReportService,
  ) {}

  @Get()
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Get loan balance freeze report data' })
  @ApiResponse({ status: 200, description: 'Report data returned' })
  async getReport(@Query() query: QueryLoanBalanceReportDto) {
    const report = await this.reportService.getReport(query);
    return { success: true, data: report };
  }

  @Get('export')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Download loan balance report as Excel' })
  @ApiResponse({ status: 200, description: 'Excel file downloaded' })
  async exportExcel(
    @Query() query: QueryLoanBalanceReportDto,
    @Res() res: Response,
  ) {
    const year = query.year || new Date().getFullYear();
    const workbook = await this.reportService.generateExcel(query);
    const filename = `Total_Saldo_Freeze_Pinjaman_${year}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
