import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDepositChangeDto {
  @IsString()
  @IsNotEmpty({ message: 'ID deposito harus diisi' })
  depositApplicationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Jumlah deposito baru harus dipilih' })
  newAmountValue: number;

  @IsString()
  @IsNotEmpty({ message: 'Tenor deposito baru harus dipilih' })
  newTenorMonths: number;
  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui syarat dan ketentuan' })
  agreedToTerms: boolean;

  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui biaya admin' })
  agreedToAdminFee: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}