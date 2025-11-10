import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsPositive, 
  Min, 
  Max, 
  IsOptional,
  IsArray,
  Matches,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @IsString()
  @IsOptional()
  @Length(10, 20, { message: 'Nomor rekening harus antara 10-20 digit' })
  @Matches(/^[0-9]+$/, { message: 'Nomor rekening harus berupa angka' })
  bankAccountNumber?: string;

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
  @IsNotEmpty({ message: 'Alasan peminjaman wajib diisi' })
  loanPurpose: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}