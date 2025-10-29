import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama department tidak boleh kosong' })
  @MinLength(2, { message: 'Nama department minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama department maksimal 100 karakter' })
  @Transform(({ value }) => value?.trim())
  departmentName: string;
}