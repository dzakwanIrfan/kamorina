import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  levelName?: string; // Filter by role/level

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  memberVerified?: boolean;

  @IsOptional()
  @IsDateString()
  birthDateStart?: string;

  @IsOptional()
  @IsDateString()
  birthDateEnd?: string;

  @IsOptional()
  @IsDateString()
  permanentEmployeeDateStart?: string;

  @IsOptional()
  @IsDateString()
  permanentEmployeeDateEnd?: string;
}