import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsPositive, 
  Min, 
  IsOptional,
  IsArray,
  Matches,
  Length,
  IsEnum,
  ValidateNested,
  IsDateString,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoanType } from '@prisma/client';

// Base DTO untuk semua jenis pinjaman
export class CreateBaseLoanDto {
  @IsEnum(LoanType, { message: 'Tipe pinjaman tidak valid' })
  loanType: LoanType;

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

// DTO untuk Cash Loan
export class CreateCashLoanDto extends CreateBaseLoanDto {
  @IsNumber()
  @IsPositive({ message: 'Jumlah pinjaman harus lebih dari 0' })
  @Type(() => Number)
  loanAmount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO untuk Goods Reimburse
export class CreateGoodsReimburseDto extends CreateBaseLoanDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama barang wajib diisi' })
  itemName: string;

  @IsNumber()
  @IsPositive({ message: 'Harga barang harus lebih dari 0' })
  @Type(() => Number)
  itemPrice: number;

  @IsDateString({}, { message: 'Format tanggal pembelian tidak valid' })
  @IsNotEmpty({ message: 'Tanggal pembelian wajib diisi' })
  purchaseDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO untuk Goods Online
export class CreateGoodsOnlineDto extends CreateBaseLoanDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama barang wajib diisi' })
  itemName: string;

  @IsNumber()
  @IsPositive({ message: 'Harga barang harus lebih dari 0' })
  @Type(() => Number)
  itemPrice: number;

  @IsUrl({}, { message: 'URL barang tidak valid' })
  @IsNotEmpty({ message: 'Link barang wajib diisi' })
  itemUrl: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO untuk Goods Phone (filled by user, prices filled by DSP)
export class CreateGoodsPhoneDto extends CreateBaseLoanDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama handphone wajib diisi' })
  itemName: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Union type untuk semua create loan DTOs
export type CreateLoanDto = 
  | CreateCashLoanDto 
  | CreateGoodsReimburseDto 
  | CreateGoodsOnlineDto 
  | CreateGoodsPhoneDto;