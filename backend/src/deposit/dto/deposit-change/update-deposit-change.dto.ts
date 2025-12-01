import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDepositChangeDto } from './create-deposit-change.dto';

export class UpdateDepositChangeDto extends PartialType(
  OmitType(CreateDepositChangeDto, ['depositApplicationId'] as const),
) {}