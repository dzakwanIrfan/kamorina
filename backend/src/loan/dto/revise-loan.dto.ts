import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsPositive, 
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

// Base revise DTO
export class ReviseLoanBaseDto {
  @IsNumber()
  @IsPositive({ message: 'Lama pinjaman harus lebih dari 0' })
  @Min(1, { message: 'Minimal tenor 1 bulan' })
  @Type(() => Number)
  loanTenor: number;

  @IsString()
  @IsNotEmpty({ message: 'Catatan revisi wajib diisi' })
  revisionNotes: string;
}

// Revise untuk Cash Loan
export class ReviseCashLoanDto extends ReviseLoanBaseDto {
  @IsNumber()
  @IsPositive({ message: 'Jumlah pinjaman harus lebih dari 0' })
  @Type(() => Number)
  loanAmount: number;
}

// Revise untuk Goods Reimburse
export class ReviseGoodsReimburseDto extends ReviseLoanBaseDto {
  @IsNumber()
  @IsPositive({ message: 'Harga barang harus lebih dari 0' })
  @Type(() => Number)
  itemPrice: number;
}

// Revise untuk Goods Online
export class ReviseGoodsOnlineDto extends ReviseLoanBaseDto {
  @IsNumber()
  @IsPositive({ message: 'Harga barang harus lebih dari 0' })
  @Type(() => Number)
  itemPrice: number;
}

// Revise untuk Goods Phone (DSP sets prices)
export class ReviseGoodsPhoneDto extends ReviseLoanBaseDto {
  @IsNumber()
  @IsPositive({ message: 'Harga retail harus lebih dari 0' })
  @Type(() => Number)
  retailPrice: number;

  @IsNumber()
  @IsPositive({ message: 'Harga koperasi harus lebih dari 0' })
  @Type(() => Number)
  cooperativePrice: number;
}

export type ReviseLoanDto = 
  | ReviseCashLoanDto 
  | ReviseGoodsReimburseDto 
  | ReviseGoodsOnlineDto 
  | ReviseGoodsPhoneDto;