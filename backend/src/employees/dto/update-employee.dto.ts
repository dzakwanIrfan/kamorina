import { IsString, IsBoolean, IsOptional, Length, Matches } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @Length(9, 9, { message: 'Nomor karyawan harus 9 digit' })
  @Matches(/^[0-9]+$/, { message: 'Nomor karyawan harus berupa angka' })
  @IsOptional()
  employeeNumber?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}