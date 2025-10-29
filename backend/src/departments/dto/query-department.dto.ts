import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class QueryDepartmentDto extends PaginationDto {
  @IsOptional()
  @IsString()
  departmentName?: string;
}