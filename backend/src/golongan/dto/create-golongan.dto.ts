import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGolonganDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama golongan tidak boleh kosong' })
  @MinLength(1, { message: 'Nama golongan minimal 1 karakter' })
  @MaxLength(10, { message: 'Nama golongan maksimal 10 karakter' })
  @Transform(({ value }) => value?.trim())
  golonganName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Deskripsi maksimal 255 karakter' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}