import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DepositStatus, DepositApprovalStep } from '@prisma/client';

export class QueryDepositDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @IsOptional()
  @IsEnum(DepositApprovalStep)
  step?: DepositApprovalStep;

  @IsOptional()
  userId?: string;
}