import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { SalaryDeductionReportService } from './salary-deduction-report.service';
import { QuerySalaryDeductionReportDto } from './dto/query-salary-deduction-report.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Salary Deduction Report')
@Controller('salary-deduction-report')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalaryDeductionReportController {
  constructor(
    private readonly reportService: SalaryDeductionReportService,
  ) {}

  @Get()
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Get salary deduction report data' })
  @ApiResponse({ status: 200, description: 'Report data returned' })
  async getReport(@Query() query: QuerySalaryDeductionReportDto) {
    const report = await this.reportService.getReport(query);
    return { success: true, data: report };
  }

  @Get('export')
  @Roles('ketua', 'payroll', 'divisi_simpan_pinjam')
  @ApiOperation({ summary: 'Download salary deduction report as Excel' })
  @ApiResponse({ status: 200, description: 'Excel file downloaded' })
  async exportExcel(
    @Query() query: QuerySalaryDeductionReportDto,
    @Res() res: Response,
  ) {
    const month = query.month || new Date().getMonth() + 1;
    const year = query.year || new Date().getFullYear();

    const workbook = await this.reportService.generateExcel(query);
    const filename = `Pemotongan_Gaji_${year}_${String(month).padStart(2, '0')}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
