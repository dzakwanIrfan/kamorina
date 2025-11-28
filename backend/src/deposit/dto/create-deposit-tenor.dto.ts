import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepositTenorDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode tidak boleh kosong' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Label tidak boleh kosong' })
  @Transform(({ value }) => value?.trim())
  label: string;

  @IsNumber()
  @Min(1, { message: 'Bulan minimal 1' })
  months: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}