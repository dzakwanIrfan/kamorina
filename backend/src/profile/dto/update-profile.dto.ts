import { IsString, IsOptional, IsDateString, MinLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal lahir tidak valid' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  birthPlace?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password lama minimal 8 karakter' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka atau karakter khusus',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}