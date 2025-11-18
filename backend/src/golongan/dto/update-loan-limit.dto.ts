import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanLimitDto } from './create-loan-limit.dto';

export class UpdateLoanLimitDto extends PartialType(CreateLoanLimitDto) {}