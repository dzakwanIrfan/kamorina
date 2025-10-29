import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class QueryLevelDto extends PaginationDto {
  @IsOptional()
  @IsString()
  levelName?: string; 
}