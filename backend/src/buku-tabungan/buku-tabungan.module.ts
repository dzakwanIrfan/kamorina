import { Module } from '@nestjs/common';
import { BukuTabunganController } from './buku-tabungan.controller';
import { BukuTabunganService } from './buku-tabungan.service';
import { AuthModule } from 'src/auth/auth.module';
import { BukuTabunganExportService } from './services/buku-tabungan-export.service';

@Module({
  imports: [AuthModule],
  controllers: [BukuTabunganController],
  providers: [BukuTabunganService, BukuTabunganExportService],
  exports: [BukuTabunganService, BukuTabunganExportService],
})
export class BukuTabunganModule {}