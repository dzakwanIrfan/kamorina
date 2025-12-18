import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ConfirmDisbursementDto {
    @IsDateString()
    @IsOptional()
    disbursementDate?: string;

    @IsString()
    @IsOptional()
    disbursementTime?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}