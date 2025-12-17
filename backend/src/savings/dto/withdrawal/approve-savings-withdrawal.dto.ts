import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

export class ApproveSavingsWithdrawalDto {
    @IsEnum(ApprovalDecision, { message: 'Decision harus APPROVED atau REJECTED' })
    decision: ApprovalDecision;

    @IsString()
    @IsOptional()
    notes?: string;
}