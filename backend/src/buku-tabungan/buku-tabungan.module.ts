import { Module } from '@nestjs/common';
import { BukuTabunganController } from './buku-tabungan.controller';
import { BukuTabunganService } from './buku-tabungan.service';

@Module({
  controllers: [BukuTabunganController],
  providers: [BukuTabunganService]
})
export class BukuTabunganModule {}
