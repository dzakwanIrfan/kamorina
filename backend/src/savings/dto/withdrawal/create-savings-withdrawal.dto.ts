import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateSavingsWithdrawalDto {
    @IsNumber()
    @Min(1000, { message: 'Jumlah penarikan minimal Rp 1.000' })
    withdrawalAmount: number;

    @IsString()
    @IsOptional()
    bankAccountNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}