import { IsEnum, IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { DepositChangeApprovalDecision } from '@prisma/client';

export class BulkApproveDepositChangeDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 perubahan deposito harus dipilih' })
  @IsString({ each: true })
  changeRequestIds: string[];

  @IsEnum(DepositChangeApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: DepositChangeApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}