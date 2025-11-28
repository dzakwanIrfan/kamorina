export interface DepositAmountOption {
  id: string;
  code: string;
  label: string;
  amount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepositTenorOption {
  id: string;
  code: string;
  label: string;
  months: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepositConfig {
  amounts: DepositAmountOption[];
  tenors: DepositTenorOption[];
  interestRate: number;
  calculationMethod: 'SIMPLE' | 'COMPOUND';
}

export interface MonthlyInterestBreakdown {
  month: number;
  openingBalance: number;
  interest: number;
  closingBalance: number;
}

export interface DepositCalculation {
  principal: number;
  tenorMonths: number;
  annualInterestRate: number;
  calculationMethod: 'SIMPLE' | 'COMPOUND';
  effectiveRate: number;
  projectedInterest: number;
  totalReturn: number;
  monthlyInterestBreakdown: MonthlyInterestBreakdown[];
}

export interface CreateDepositAmountDto {
  code: string;
  label: string;
  amount: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDepositAmountDto {
  code?: string;
  label?: string;
  amount?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateDepositTenorDto {
  code: string;
  label: string;
  months: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDepositTenorDto {
  code?: string;
  label?: string;
  months?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface QueryDepositOptionParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}