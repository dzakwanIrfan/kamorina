import { Module } from '@nestjs/common';
import { LoanBalanceReportService } from './loan-balance-report.service';
import { LoanBalanceReportController } from './loan-balance-report.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoanBalanceReportController],
  providers: [LoanBalanceReportService],
  exports: [LoanBalanceReportService],
})
export class LoanBalanceReportModule {}
