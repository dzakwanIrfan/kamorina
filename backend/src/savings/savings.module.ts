import { Module } from '@nestjs/common';
import { SavingsWithdrawalService } from './savings-withdrawal.service';
import { SavingsWithdrawalController } from './savings-withdrawal.controller';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [
        SavingsWithdrawalController,
    ],
    providers: [
        SavingsWithdrawalService,
    ],
    exports: [SavingsWithdrawalService],
})
export class SavingsModule { }