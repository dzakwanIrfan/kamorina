import { IsString, IsDateString, IsInt, Min, Max, Length, Matches, IsNotEmpty } from 'class-validator';

export class SubmitApplicationDto {
  @IsString()
  @Length(16, 16, { message: 'NIK harus 16 digit' })
  @Matches(/^[0-9]+$/, { message: 'NIK harus berupa angka' })
  @IsNotEmpty({ message: 'NIK wajib diisi' })
  nik: string;

  @IsString()
  @Length(16, 16, { message: 'NPWP harus 16 digit' })
  @Matches(/^[0-9]+$/, { message: 'NPWP harus berupa angka' })
  @IsNotEmpty({ message: 'NPWP wajib diisi' })
  npwp: string;

  @IsDateString({}, { message: 'Format tanggal lahir tidak valid' })
  @IsNotEmpty({ message: 'Tanggal lahir wajib diisi' })
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty({ message: 'Tempat lahir wajib diisi' })
  birthPlace: string;

  @IsInt({ message: 'Rencana cicilan harus berupa angka' })
  @Min(1, { message: 'Rencana cicilan harus 1 atau 2' })
  @Max(2, { message: 'Rencana cicilan harus 1 atau 2' })
  @IsNotEmpty({ message: 'Rencana cicilan wajib diisi' })
  installmentPlan: number;
}