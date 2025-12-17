import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDepositChangeDto {
  @IsString()
  @IsNotEmpty({ message: 'ID deposito harus diisi' })
  depositApplicationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Jumlah deposito baru harus dipilih' })
  newAmountCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Tenor deposito baru harus dipilih' })
  newTenorCode: string;

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