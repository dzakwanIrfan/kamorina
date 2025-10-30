import { IsString, IsBoolean, IsOptional, Length, Matches, IsNotEmpty } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @Length(9, 9, { message: 'Nomor karyawan harus 9 digit' })
  @Matches(/^[0-9]+$/, { message: 'Nomor karyawan harus berupa angka' })
  @IsNotEmpty({ message: 'Nomor karyawan wajib diisi' })
  employeeNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  fullName: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}