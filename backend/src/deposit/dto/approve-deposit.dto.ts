import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DepositApprovalDecision } from '@prisma/client';

export class ApproveDepositDto {
  @IsEnum(DepositApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: DepositApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}