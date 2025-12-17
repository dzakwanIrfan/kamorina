import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ConfirmDisbursementDto {
    @IsDateString()
    @IsOptional()
    transactionDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}