import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDepositStopDto {
  @IsString()
  @IsNotEmpty({ message: 'ID deposito harus diisi' })
  depositApplicationId: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui syarat dan ketentuan' })
  agreedToTerms: boolean;

  @IsBoolean()
  @IsNotEmpty({ message: 'Anda harus menyetujui biaya penalti' })
  agreedToAdminFee: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
