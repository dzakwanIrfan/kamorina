import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { DepositChangeStatus, DepositChangeApprovalStep, DepositChangeType } from '@prisma/client';

export class QueryDepositChangeDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DepositChangeStatus)
  status?: DepositChangeStatus;

  @IsOptional()
  @IsEnum(DepositChangeApprovalStep)
  step?: DepositChangeApprovalStep;

  @IsOptional()
  @IsEnum(DepositChangeType)
  changeType?: DepositChangeType;

  @IsOptional()
  userId?: string;

  @IsOptional()
  depositApplicationId?: string;
}