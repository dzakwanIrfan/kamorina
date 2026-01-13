import { Module } from '@nestjs/common';
import { LoanRepaymentController } from './loan-repayment.controller';
import { LoanRepaymentService } from './loan-repayment.service';
import { RepaymentNumberService } from './services/repayment-number.service';
import { RepaymentCalculationService } from './services/repayment-calculation.service';
import { RepaymentValidationService } from './services/repayment-validation.service';
import { RepaymentCrudService } from './services/repayment-crud.service';
import { RepaymentApprovalService } from './services/repayment-approval.service';
import { RepaymentNotificationService } from './services/repayment-notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [LoanRepaymentController],
  providers: [
    LoanRepaymentService,
    RepaymentNumberService,
    RepaymentCalculationService,
    RepaymentValidationService,
    RepaymentCrudService,
    RepaymentApprovalService,
    RepaymentNotificationService,
  ],
  exports: [LoanRepaymentService],
})
export class LoanRepaymentModule {}
