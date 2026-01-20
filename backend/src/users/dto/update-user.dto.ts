import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateEmployeeDto } from '../../employees/dto/update-employee.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmployeeDto)
  employeeUpdates?: UpdateEmployeeDto;
}
