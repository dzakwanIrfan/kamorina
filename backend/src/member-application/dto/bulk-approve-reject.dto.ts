import { IsEnum, IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class BulkApproveRejectDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal 1 aplikasi harus dipilih' })
  @IsString({ each: true })
  applicationIds: string[];

  @IsEnum(ApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
  decision: ApprovalDecision;

  @IsString()
  @IsOptional()
  notes?: string;
}