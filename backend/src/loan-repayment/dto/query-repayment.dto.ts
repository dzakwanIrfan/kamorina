import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RepaymentStatus, RepaymentApprovalStep } from '@prisma/client';

export class QueryRepaymentDto extends PaginationDto {
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus;

  @IsOptional()
  @IsEnum(RepaymentApprovalStep)
  step?: RepaymentApprovalStep;

  @IsOptional()
  userId?: string;

  @IsOptional()
  loanApplicationId?: string;
}
