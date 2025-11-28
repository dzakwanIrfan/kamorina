import { PartialType } from '@nestjs/mapped-types';
import { CreateDepositAmountDto } from './create-deposit-amount.dto';

export class UpdateDepositAmountDto extends PartialType(CreateDepositAmountDto) {}