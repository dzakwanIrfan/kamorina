import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateDepositDto {
  @IsString()
  @IsNotEmpty({ message: 'Jumlah deposito harus dipilih' })
  depositAmountCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Jangka waktu harus dipilih' })
  depositTenorCode: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui syarat dan ketentuan' })
  agreedToTerms: boolean;
}