import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { MembershipFeeProcessor } from './services/membership-fee.processor';
import { MandatorySavingsProcessor } from './services/mandatory-savings.processor';
import { DepositSavingsProcessor } from './services/deposit-savings.processor';
import { LoanInstallmentProcessor } from './services/loan-installment.processor';
import { InterestCalculatorProcessor } from './services/interest-calculator.processor';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PayrollController],
  providers: [
    PayrollService,
    MembershipFeeProcessor,
    MandatorySavingsProcessor,
    DepositSavingsProcessor,
    LoanInstallmentProcessor,
    InterestCalculatorProcessor,
  ],
  exports: [PayrollService],
})
export class PayrollModule {}
