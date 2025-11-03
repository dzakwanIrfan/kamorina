import { IsString, IsBoolean, IsOptional, Length, Matches, IsEnum } from 'class-validator';

export enum EmployeeType {
  PERMANENT = 'TETAP',
  CONTRACT = 'KONTRAK',
}

export class UpdateEmployeeDto {
  @IsString()
  @Length(9, 9, { message: 'Nomor karyawan harus 9 digit' })
  @Matches(/^[0-9]+$/, { message: 'Nomor karyawan harus berupa angka' })
  @IsOptional()
  employeeNumber?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  golonganId?: string;

  @IsEnum(EmployeeType, { message: 'Tipe karyawan tidak valid' })
  @IsOptional()
  employeeType?: EmployeeType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}