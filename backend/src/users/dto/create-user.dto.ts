import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEmployeeDto } from '../../employees/dto/create-employee.dto';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsString()
  npwp?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEmployeeDto)
  newEmployee?: CreateEmployeeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  memberVerified?: boolean;

  @IsOptional()
  emailVerified?: boolean;

  @IsOptional()
  installmentPlan?: number;

  @IsOptional()
  @IsString()
  avatar?: string;
}
