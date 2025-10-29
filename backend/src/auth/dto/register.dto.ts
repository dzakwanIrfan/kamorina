import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Nama minimal 3 karakter' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsString()
  @Length(9, 9, { message: 'Nomor Induk Karyawan harus 9 digit' })
  @Matches(/^[0-9]+$/, { message: 'Nomor Induk Karyawan harus berupa angka' })
  employeeNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka atau karakter khusus',
  })
  password: string;

  @IsString()
  confPassword: string;
}