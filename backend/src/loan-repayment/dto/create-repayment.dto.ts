import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateRepaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Loan Application ID wajib diisi' })
  loanApplicationId: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'Persetujuan member wajib diisi' })
  isAgreedByMember: boolean;
}
