import { IsArray, ArrayMinSize, IsString, IsDateString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class BulkProcessAuthorizationDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 pinjaman harus dipilih' })
  @IsString({ each: true })
  loanIds: string[];

  @IsDateString({}, { message: 'Format tanggal tidak valid' })
  @IsNotEmpty({ message: 'Tanggal otorisasi wajib diisi' })
  authorizationDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam otorisasi wajib diisi' })
  @Matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, { 
    message: 'Format jam harus HH:mm (contoh: 14:30)' 
  })
  authorizationTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}