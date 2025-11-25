import { PartialType, OmitType } from '@nestjs/mapped-types';
import { 
  CreateCashLoanDto, 
  CreateGoodsReimburseDto, 
  CreateGoodsOnlineDto, 
  CreateGoodsPhoneDto 
} from './create-loan.dto';

export class UpdateCashLoanDto extends PartialType(OmitType(CreateCashLoanDto, ['loanType'] as const)) {}
export class UpdateGoodsReimburseDto extends PartialType(OmitType(CreateGoodsReimburseDto, ['loanType'] as const)) {}
export class UpdateGoodsOnlineDto extends PartialType(OmitType(CreateGoodsOnlineDto, ['loanType'] as const)) {}
export class UpdateGoodsPhoneDto extends PartialType(OmitType(CreateGoodsPhoneDto, ['loanType'] as const)) {}

export type UpdateLoanDto = 
  | UpdateCashLoanDto 
  | UpdateGoodsReimburseDto 
  | UpdateGoodsOnlineDto 
  | UpdateGoodsPhoneDto;