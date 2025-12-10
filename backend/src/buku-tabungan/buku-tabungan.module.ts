import { Module } from '@nestjs/common';
import { BukuTabunganController } from './buku-tabungan.controller';
import { BukuTabunganService } from './buku-tabungan.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BukuTabunganController],
  providers: [BukuTabunganService],
  exports: [BukuTabunganService],
})
export class BukuTabunganModule {}