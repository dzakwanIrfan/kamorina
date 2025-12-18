import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ConfirmAuthorizationDto {
    @IsDateString()
    @IsOptional()
    authorizationDate?: string;

    @IsString()
    @IsOptional()
    authorizationTime?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}