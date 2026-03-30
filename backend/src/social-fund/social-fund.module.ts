import { Module } from '@nestjs/common';
import { SocialFundController } from './social-fund.controller';
import { SocialFundService } from './social-fund.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialFundController],
  providers: [SocialFundService],
  exports: [SocialFundService],
})
export class SocialFundModule {}
