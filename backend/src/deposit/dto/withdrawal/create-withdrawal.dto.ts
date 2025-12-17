import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateDepositWithdrawalDto {
    @IsString()
    @IsNotEmpty({ message: 'ID deposito harus diisi' })
    depositApplicationId: string;

    @IsNumber()
    @Min(0, { message: 'Jumlah penarikan minimal 0' })
    withdrawalAmount: number;

    @IsString()
    @IsOptional()
    bankAccountNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}