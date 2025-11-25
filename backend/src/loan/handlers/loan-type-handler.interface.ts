import { LoanType } from '@prisma/client';

export interface LoanTypeHandler {
  loanType: LoanType;
  
  validateLoanAmount(userId: string, amount: number): Promise<void>;
  
  createTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
  ): Promise<void>;
  
  updateTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
  ): Promise<void>;
  
  reviseTypeSpecificDetails(
    tx: any,
    loanApplicationId: string,
    dto: any,
  ): Promise<void>;
  
  getIncludeRelations(): any;
}