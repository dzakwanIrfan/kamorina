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
  calculationMethod: "SIMPLE" | "COMPOUND";
}

export interface DepositCalculation {
  monthlyDeposit: number; // Setoran per bulan
  tenorMonths: number; // Jangka waktu (bulan)
  totalPrincipal: number; // Total setoran (monthlyDeposit × tenorMonths)
  annualInterestRate: number; // Bunga tahunan (%)
  calculationMethod: "SIMPLE" | "COMPOUND";
  effectiveRate: number; // Effective annual rate
  projectedInterest: number; // Total bunga yang didapat
  totalReturn: number; // Total penerimaan (totalPrincipal + projectedInterest)
  monthlyInterestBreakdown: Array<{
    month: number;
    monthlyDeposit: number;
    depositAccumulation: number; // Akumulasi setoran sampai bulan ini
    interestAccumulation: number; // Akumulasi bunga sampai bulan ini
    totalBalance: number; // depositAccumulation + interestAccumulation
  }>;
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
  createdAt?: string; // Optional since backend might handle it, but defined here for completeness if needed? No, DTO usually input.
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
  isActive?: string | boolean;
}
