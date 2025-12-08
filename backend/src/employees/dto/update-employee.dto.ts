import {
  IsString,
  IsBoolean,
  IsOptional,
  Length,
  Matches,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum EmployeeType {
  TETAP = 'TETAP',
  KONTRAK = 'KONTRAK',
}

export class UpdateEmployeeDto {
  @IsString()
  @Length(9, 10, { message: 'Nomor karyawan harus 9-10 karakter' })
  @Matches(/^[K]?[0-9]+$/, {
    message:
      'Nomor karyawan harus berupa angka atau diawali huruf K diikuti angka',
  })
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

  @IsOptional()
  permanentEmployeeDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
