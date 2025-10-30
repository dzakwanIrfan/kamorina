import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApplicationStatus, ApprovalStep } from '@prisma/client';

export class QueryApplicationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(ApprovalStep)
  step?: ApprovalStep;

  @IsOptional()
  userId?: string;
}