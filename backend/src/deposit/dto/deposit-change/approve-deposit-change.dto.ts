import { IsEnum, IsString, IsOptional } from 'class-validator';
import { DepositChangeApprovalDecision } from '@prisma/client';

export class ApproveDepositChangeDto {
  @IsEnum(DepositChangeApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: DepositChangeApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}