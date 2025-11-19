import { IsEnum, IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { DepositApprovalDecision } from '@prisma/client';

export class BulkApproveDepositDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 deposito harus dipilih' })
  @IsString({ each: true })
  depositIds: string[];

  @IsEnum(DepositApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: DepositApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}