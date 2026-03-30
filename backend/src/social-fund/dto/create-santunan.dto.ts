import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSantunanDto {
  @IsString()
  @IsNotEmpty({ message: 'Anggota penerima harus dipilih' })
  recipientUserId: string;

  @IsNumber()
  @IsPositive({ message: 'Angka santunan harus lebih dari 0' })
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Alasan/peruntukan harus diisi' })
  description: string;
}
