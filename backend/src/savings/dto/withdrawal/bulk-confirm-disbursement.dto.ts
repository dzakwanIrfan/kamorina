import { IsString, IsOptional, IsArray, ArrayMinSize, IsDateString } from 'class-validator';

export class BulkConfirmDisbursementDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Minimal 1 penarikan harus dipilih' })
    @IsString({ each: true })
    withdrawalIds: string[];

    @IsDateString()
    @IsOptional()
    transactionDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
