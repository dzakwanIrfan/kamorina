import { IsString, IsNotEmpty, Length, Matches, IsEnum, IsDateString, IsOptional } from 'class-validator';

export enum EmployeeType {
  TETAP = 'TETAP',
  KONTRAK = 'KONTRAK',
}

export class CreateEmployeeDto {
  @IsString()
  @Length(9, 10, { message: 'Nomor karyawan harus 9-10 karakter' })
  @Matches(/^[K]?[0-9]+$/, { message: 'Nomor karyawan harus berupa angka atau diawali huruf K diikuti angka' })
  @IsNotEmpty({ message: 'Nomor karyawan wajib diisi' })
  employeeNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Department wajib diisi' })
  departmentId: string;

  @IsString()
  @IsNotEmpty({ message: 'Golongan wajib diisi' })
  golonganId: string;

  @IsEnum(EmployeeType, { message: 'Tipe karyawan tidak valid' })
  @IsNotEmpty({ message: 'Tipe karyawan wajib diisi' })
  employeeType: EmployeeType;

  @IsOptional()
  permanentEmployeeDate?: Date;
}