import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { LoanStatus, LoanApprovalStep, LoanType } from '@prisma/client';

export class QueryLoanDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsEnum(LoanApprovalStep)
  step?: LoanApprovalStep;

  @IsOptional()
  @IsEnum(LoanType)
  loanType?: LoanType;

  @IsOptional()
  userId?: string;
}