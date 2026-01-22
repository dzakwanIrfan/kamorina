import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmailConfigDto {
  @ApiProperty({ description: 'SMTP Host', example: 'smtp.gmail.com' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'SMTP Port', example: 587 })
  @IsInt()
  port: number;

  @ApiProperty({
    description: 'SMTP Username/Email',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  username: string;

  @ApiProperty({
    description: 'SMTP Password (will be encrypted)',
    example: 'secret-password',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Sender Name',
    example: 'My Company <no-reply@company.com>',
  })
  @IsString()
  fromName: string;

  @ApiPropertyOptional({
    description: 'Is this configuration active?',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Label for this configuration',
    example: 'Primary Email',
  })
  @IsString()
  @IsOptional()
  label?: string;
}
