import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveMemberDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}