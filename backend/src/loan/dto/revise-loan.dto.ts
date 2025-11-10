import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsPositive, 
  IsOptional,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviseLoanDto {
  @IsNumber()
  @IsPositive({ message: 'Jumlah pinjaman harus lebih dari 0' })
  @Type(() => Number)
  loanAmount: number;

  @IsNumber()
  @IsPositive({ message: 'Lama pinjaman harus lebih dari 0' })
  @Min(1, { message: 'Minimal tenor 1 bulan' })
  @Type(() => Number)
  loanTenor: number;

  @IsString()
  @IsNotEmpty({ message: 'Catatan revisi wajib diisi' })
  revisionNotes: string;
}