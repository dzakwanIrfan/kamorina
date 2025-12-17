import { IsEnum, IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class BulkApproveSavingsWithdrawalDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Minimal 1 penarikan harus dipilih' })
    @IsString({ each: true })
    withdrawalIds: string[];

    @IsEnum(ApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
    decision: ApprovalDecision;

    @IsString()
    @IsOptional()
    notes?: string;
}