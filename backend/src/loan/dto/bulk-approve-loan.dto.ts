import { IsEnum, IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { LoanApprovalDecision } from '@prisma/client';

export class BulkApproveLoanDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 pinjaman harus dipilih' })
  @IsString({ each: true })
  loanIds: string[];

  @IsEnum(LoanApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: LoanApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}