import { Module } from '@nestjs/common';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

// Services
import { LoanCrudService } from './services/loan-crud.service';
import { LoanSubmissionService } from './services/loan-submission.service';
import { LoanApprovalService } from './services/loan-approval.service';
import { LoanDisbursementService } from './services/loan-disbursement.service';
import { LoanAuthorizationService } from './services/loan-authorization.service';
import { LoanQueryService } from './services/loan-query.service';
import { LoanValidationService } from './services/loan-validation.service';
import { LoanCalculationService } from './services/loan-calculation.service';
import { LoanNumberService } from './services/loan-number.service';
import { LoanNotificationService } from './services/loan-notification.service';

// Handlers
import { LoanHandlerFactory } from './handlers/loan-handler.factory';
import { CashLoanHandler } from './handlers/cash-loan.handler';
import { GoodsReimburseHandler } from './handlers/goods-reimburse.handler';
import { GoodsOnlineHandler } from './handlers/goods-online.handler';
import { GoodsPhoneHandler } from './handlers/goods-phone.handler';

// External modules
import { MailModule } from '../mail/mail.module';
import { UploadModule } from '../upload/upload.module';
import { LoanInstallmentService } from './services/loan-installment.service';

@Module({
  imports: [MailModule, UploadModule],
  controllers: [LoanController],
  providers: [
    // Main service
    LoanService,
    
    // Feature services
    LoanCrudService,
    LoanSubmissionService,
    LoanApprovalService,
    LoanDisbursementService,
    LoanAuthorizationService,
    LoanQueryService,
    LoanInstallmentService,
    
    // Utility services
    LoanValidationService,
    LoanCalculationService,
    LoanNumberService,
    LoanNotificationService,
    
    // Handlers
    LoanHandlerFactory,
    CashLoanHandler,
    GoodsReimburseHandler,
    GoodsOnlineHandler,
    GoodsPhoneHandler,
  ],
  exports: [LoanService, LoanInstallmentService],

})
export class LoanModule {}