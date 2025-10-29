import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'NIK harus berupa angka' })
  @MinLength(10, { message: 'NIK minimal 10 digit' })
  nik?: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password harus mengandung huruf besar, huruf kecil, dan angka atau karakter khusus',
  })
  password: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsDateString()
  permanentEmployeeDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  installmentPlan?: number;
}