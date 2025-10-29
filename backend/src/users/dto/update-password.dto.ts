import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password harus mengandung huruf besar, huruf kecil, dan angka atau karakter khusus',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}