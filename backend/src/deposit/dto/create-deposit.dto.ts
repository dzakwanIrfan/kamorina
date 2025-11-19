import { IsEnum, IsBoolean, IsNotEmpty } from 'class-validator';
import { DepositAmount, DepositTenor } from '@prisma/client';

export class CreateDepositDto {
  @IsEnum(DepositAmount, { message: 'Jumlah deposito tidak valid' })
  depositAmount: DepositAmount;

  @IsEnum(DepositTenor, { message: 'Jangka waktu tidak valid' })
  depositTenor: DepositTenor;

  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui syarat dan ketentuan' })
  agreedToTerms: boolean;
}