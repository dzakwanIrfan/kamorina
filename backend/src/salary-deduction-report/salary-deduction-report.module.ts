import { Module } from '@nestjs/common';
import { SalaryDeductionReportService } from './salary-deduction-report.service';
import { SalaryDeductionReportController } from './salary-deduction-report.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalaryDeductionReportController],
  providers: [SalaryDeductionReportService],
  exports: [SalaryDeductionReportService],
})
export class SalaryDeductionReportModule {}
