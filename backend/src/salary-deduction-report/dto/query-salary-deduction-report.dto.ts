import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySalaryDeductionReportDto {
  @ApiPropertyOptional({ description: 'Month (1-12)', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2025 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;
}
