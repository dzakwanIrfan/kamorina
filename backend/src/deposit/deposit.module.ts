import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { DepositOptionService } from './deposit-option.service';
import { DepositOptionController } from './deposit-option.controller';
import { DepositChangeService } from './deposit-change.service';
import { DepositChangeController } from './deposit-change.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [DepositService, DepositOptionService, DepositChangeService],
  controllers: [
    DepositController,
    DepositOptionController,
    DepositChangeController,
  ],
  exports: [DepositService, DepositOptionService, DepositChangeService],
})
export class DepositModule {}
