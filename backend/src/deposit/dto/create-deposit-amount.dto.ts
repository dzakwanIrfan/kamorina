import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepositAmountDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode tidak boleh kosong' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Label tidak boleh kosong' })
  @Transform(({ value }) => value?.trim())
  label: string;

  @IsNumber()
  @Min(0, { message: 'Jumlah minimal 0' })
  amount: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}