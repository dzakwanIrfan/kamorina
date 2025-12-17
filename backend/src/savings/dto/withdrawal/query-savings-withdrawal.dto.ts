import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SavingsWithdrawalStatus, SavingsWithdrawalStep } from '@prisma/client';

export class QuerySavingsWithdrawalDto extends PaginationDto {
    @IsOptional()
    @IsEnum(SavingsWithdrawalStatus)
    status?: SavingsWithdrawalStatus;

    @IsOptional()
    @IsEnum(SavingsWithdrawalStep)
    step?: SavingsWithdrawalStep;

    @IsOptional()
    userId?: string;
}