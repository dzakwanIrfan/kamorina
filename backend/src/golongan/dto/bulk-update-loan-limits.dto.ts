import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LoanLimitItem {
  @IsString()
  @IsNotEmpty()
  minYearsOfService: string;

  @IsString()
  maxYearsOfService: string;

  @IsString()
  @IsNotEmpty()
  maxLoanAmount: string;
}

export class BulkUpdateLoanLimitsDto {
  @IsString()
  @IsNotEmpty({ message: 'Golongan ID tidak boleh kosong' })
  golonganId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoanLimitItem)
  limits: LoanLimitItem[];
}