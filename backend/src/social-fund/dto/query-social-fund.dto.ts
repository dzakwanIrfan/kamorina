import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SocialFundTransactionType } from '@prisma/client';

export class QuerySocialFundDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SocialFundTransactionType)
  type?: SocialFundTransactionType;
}
