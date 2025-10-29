import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLevelDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama level tidak boleh kosong' })
  @MinLength(2, { message: 'Nama level minimal 2 karakter' })
  @MaxLength(50, { message: 'Nama level maksimal 50 karakter' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  levelName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Deskripsi maksimal 255 karakter' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}