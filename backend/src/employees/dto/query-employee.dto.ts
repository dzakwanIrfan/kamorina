import { IsOptional, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum EmployeeType {
  PERMANENT = 'TETAP',
  CONTRACT = 'KONTRAK',
}

export class QueryEmployeeDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isActive?: any;

  @IsOptional()
  employeeNumber?: string;

  @IsOptional()
  fullName?: string;

  @IsOptional()
  departmentId?: string;

  @IsOptional()
  golonganId?: string;

  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;
}