import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class BulkApproveRepaymentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 pelunasan harus dipilih' })
  @IsString({ each: true })
  repaymentIds: string[];

  @IsEnum(ApprovalDecision, {
    message: 'Decision harus APPROVED atau REJECTED',
  })
  decision: ApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}
