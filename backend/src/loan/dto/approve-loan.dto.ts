import { IsEnum, IsString, IsOptional } from 'class-validator';
import { LoanApprovalDecision } from '@prisma/client';

export class ApproveLoanDto {
  @IsEnum(LoanApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: LoanApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}