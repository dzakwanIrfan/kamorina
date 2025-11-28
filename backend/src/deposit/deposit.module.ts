import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { DepositOptionService } from './deposit-option.service';
import { DepositOptionController } from './deposit-option.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [DepositService, DepositOptionService],
  controllers: [DepositController, DepositOptionController],
  exports: [DepositService, DepositOptionService],
})
export class DepositModule {}