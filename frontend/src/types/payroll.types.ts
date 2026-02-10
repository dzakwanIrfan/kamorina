export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  name: string;
  isProcessed: boolean;
  processedAt: string | null;
  totalAmount: string;
  transactionCount: number;
  loanInstallmentCount?: number;
}

export interface PayrollTransaction {
  id: string;
  user: {
    id: string;
    name: string;
    employeeNumber?: string;
    department?: string;
  };
  iuranPendaftaran: string;
  iuranBulanan: string;
  tabunganDeposito: string;
  bunga: string;
  shu: string;
  penarikan: string;
  transactionDate: string;
}

export interface PayrollProcessResult {
  periodId: string;
  periodName: string;
  processedAt: string;
  summary: {
    membership: {
      count: number;
      total: string;
      errors: number;
    };
    mandatorySavings: {
      count: number;
      total: string;
      errors: number;
    };
    depositSavings: {
      count: number;
      total: string;
      errors: number;
    };
    loanInstallment: {
      count: number;
      total: string;
      errors: number;
    };
    interest: {
      count: number;
      total: string;
      errors: number;
    };
    grandTotal: string;
  };
}

export interface PayrollPreview {
  period: string;
  preview: {
    pendingMembershipFees: number;
    activeMembersForMandatorySavings: number;
    activeDeposits: number;
    activeLoans: number;
  };
}

export interface QueryPayrollParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isProcessed?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface QueryPayrollTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ManualPayrollDto {
  month?: number;
  year?: number;
  force?: boolean;
}

export interface BulkDeletePayrollDto {
  periodIds: string[];
}
