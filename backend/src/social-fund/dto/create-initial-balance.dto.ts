import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInitialBalanceDto {
  @IsNumber()
  @IsPositive({ message: 'Jumlah saldo awal harus lebih dari 0' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
