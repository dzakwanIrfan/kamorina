import { LoanType } from '@prisma/client';

export interface LoanTypeHandler {
  loanType: LoanType;
  
  validateLoanAmount(userId: string, amount: number): Promise<void>;
  
  createTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
    shopMarginRate?: number | null,
  ): Promise<void>;
  
  updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
    shopMarginRate?: number | null,
  ): Promise<void>;
  
  reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
    shopMarginRate?: number | null,
  ): Promise<void>;
  
  getIncludeRelations(): any;
}