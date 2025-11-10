import { IsDateString, IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class ProcessDisbursementDto {
  @IsDateString({}, { message: 'Format tanggal tidak valid' })
  @IsNotEmpty({ message: 'Tanggal transaksi wajib diisi' })
  disbursementDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam transaksi wajib diisi' })
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, { 
    message: 'Format jam harus HH:mm (contoh: 14:30)' 
  })
  disbursementTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}