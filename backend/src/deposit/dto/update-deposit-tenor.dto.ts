import { PartialType } from '@nestjs/mapped-types';
import { CreateDepositTenorDto } from './create-deposit-tenor.dto';

export class UpdateDepositTenorDto extends PartialType(CreateDepositTenorDto) {}