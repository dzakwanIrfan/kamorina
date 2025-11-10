import { Module } from '@nestjs/common';
import { GolonganService } from './golongan.service';
import { GolonganController } from './golongan.controller';

@Module({
  controllers: [GolonganController],
  providers: [GolonganService],
  exports: [GolonganService],
})
export class GolonganModule {}