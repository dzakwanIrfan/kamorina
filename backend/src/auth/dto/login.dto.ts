import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  emailOrNik: string;

  @IsString()
  @MinLength(8)
  password: string;
}