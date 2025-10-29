import { Module } from '@nestjs/common';
import { MemberApplicationController } from './member-application.controller';
import { MemberApplicationService } from './member-application.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [MemberApplicationController],
  providers: [MemberApplicationService],
  exports: [MemberApplicationService],
})
export class MemberApplicationModule {}