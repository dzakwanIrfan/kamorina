import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoanLimitDto {
  @IsString()
  @IsNotEmpty({ message: 'Golongan ID tidak boleh kosong' })
  golonganId: string;

  @IsNumber()
  @Min(0, { message: 'Minimal tahun kerja tidak boleh negatif' })
  @Type(() => Number)
  minYearsOfService: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Maksimal tahun kerja tidak boleh negatif' })
  @Type(() => Number)
  maxYearsOfService?: number;

  @IsNumber()
  @Min(0, { message: 'Maksimal pinjaman tidak boleh negatif' })
  @Type(() => Number)
  maxLoanAmount: number;
}