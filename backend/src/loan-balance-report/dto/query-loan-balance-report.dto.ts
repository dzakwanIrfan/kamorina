import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLoanBalanceReportDto {
  @ApiPropertyOptional({ description: 'Year', example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;
}
