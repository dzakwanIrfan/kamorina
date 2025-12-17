import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { DepositWithdrawalStatus, DepositWithdrawalStep } from '@prisma/client';

export class QueryWithdrawalDto extends PaginationDto {
    @IsOptional()
    @IsEnum(DepositWithdrawalStatus)
    status?: DepositWithdrawalStatus;

    @IsOptional()
    @IsEnum(DepositWithdrawalStep)
    step?: DepositWithdrawalStep;

    @IsOptional()
    userId?: string;

    @IsOptional()
    depositApplicationId?: string;
}