import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class AssignRoleDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 role' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  levelIds: string[];
}