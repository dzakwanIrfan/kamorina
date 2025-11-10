import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class QueryGolonganDto extends PaginationDto {
  @IsOptional()
  @IsString()
  golonganName?: string;
}