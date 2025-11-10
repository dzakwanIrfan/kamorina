import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { LoanStatus, LoanApprovalStep } from '@prisma/client';

export class QueryLoanDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsEnum(LoanApprovalStep)
  step?: LoanApprovalStep;

  @IsOptional()
  userId?: string;
}