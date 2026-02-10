import {
  IsInt,
  IsOptional,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsIn,
  IsArray,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualPayrollDto {
  @ApiPropertyOptional({ description: 'Month (1-12)', example: 12 })
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

  @ApiPropertyOptional({ description: 'Force reprocess if already processed' })
  @IsOptional()
  force?: boolean;
}

export class PayrollPeriodQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class QueryPayrollDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by period name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'year' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Filter by processed status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isProcessed?: boolean;

  @ApiPropertyOptional({ description: 'Filter start date (ISO)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (ISO)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class QueryPayrollTransactionsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by member name or number' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class BulkDeletePayrollDto {
  @ApiProperty({ description: 'Array of period IDs to delete' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  periodIds: string[];
}

export class PayrollStatusResponseDto {
  @ApiProperty()
  periodId: string;

  @ApiProperty()
  periodName: string;

  @ApiProperty()
  month: number;

  @ApiProperty()
  year: number;

  @ApiProperty()
  isProcessed: boolean;

  @ApiProperty({ nullable: true })
  processedAt: Date | null;

  @ApiProperty()
  totalAmount: string;

  @ApiProperty()
  transactionCount: number;
}
