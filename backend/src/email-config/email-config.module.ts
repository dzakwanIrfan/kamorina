import { Module } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';
import { EmailConfigController } from './email-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionUtil } from '../common/utils/encryption.util';

@Module({
  imports: [PrismaModule],
  controllers: [EmailConfigController],
  providers: [EmailConfigService, EncryptionUtil],
  exports: [EmailConfigService, EncryptionUtil],
})
export class EmailConfigModule {}
