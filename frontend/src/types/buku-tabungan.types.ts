// Saldo types
export interface SaldoSummary {
  saldoPokok: number | string;
  saldoWajib: number | string;
  saldoSukarela: number | string;
  bungaDeposito: number | string;
  totalSaldo: number | string;
}

// Transaction summary types
export interface TransactionSummary {
  totalIuranPendaftaran: number | string;
  totalIuranBulanan: number | string;
  totalTabunganDeposito: number | string;
  totalShu: number | string;
  totalPenarikan: number | string;
  totalBunga: number | string;
}

// User info embedded in account
export interface AccountUser {
  id: string;
  name: string;
  email: string;
  employee?: {
    employeeNumber: string;
    fullName: string;
    department?: {
      id: string;
      departmentName: string;
    };
  };
}

// Savings Account
export interface SavingsAccount {
  id: string;
  userId: string;
  user: AccountUser;
  saldoPokok: number | string;
  saldoWajib: number | string;
  saldoSukarela: number | string;
  bungaDeposito: number | string;
  createdAt: string;
  updatedAt: string;
}

// Buku Tabungan Response
export interface BukuTabunganResponse {
  account: SavingsAccount;
  summary: SaldoSummary;
  transactionSummary?: TransactionSummary;
}

// Payroll Period embedded in transaction
export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  name?: string;
}

// Savings Transaction
export interface SavingsTransaction {
  id: string;
  savingsAccountId: string;
  payrollPeriodId: string;
  payrollPeriod?: PayrollPeriod;
  transactionDate: string;
  iuranPendaftaran: number | string;
  iuranBulanan: number | string;
  tabunganDeposito: number | string;
  shu: number | string;
  penarikan: number | string;
  bunga: number | string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Query params for buku tabungan
export interface QueryBukuTabunganParams {
  includeTransactionSummary?: boolean;
}

// Query params for transactions
export interface QueryTransactionParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  payrollPeriodId?: string;
  month?: number;
  year?: number;
}

// Employee type enum
export type EmployeeType = 'TETAP' | 'KONTRAK';

// Extended user info for list view (includes full employee details)
export interface AccountListUser {
  id: string;
  name: string;
  email: string;
  employee: {
    employeeNumber: string;
    fullName: string;
    employeeType: EmployeeType;
    department: {
      id: string;
      departmentName: string;
    };
    golongan: {
      id: string;
      golonganName: string;
    };
  };
}

// Savings Account list item (for admin view)
export interface SavingsAccountListItem {
  id: string;
  userId: string;
  user: AccountListUser;
  saldoPokok: number | string;
  saldoWajib: number | string;
  saldoSukarela: number | string;
  bungaDeposito: number | string;
  totalSaldo: number | string;
  createdAt: string;
  updatedAt: string;
}

// Query params for all accounts
export interface QueryAllAccountsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  departmentId?: string;
  employeeType?: EmployeeType;
  includeTransactionSummary?: boolean;
}
