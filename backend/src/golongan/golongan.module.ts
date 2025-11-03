import { Module } from '@nestjs/common';
import { GolonganController } from './golongan.controller';
import { GolonganService } from './golongan.service';

@Module({
  controllers: [GolonganController],
  providers: [GolonganService]
})
export class GolonganModule {}
