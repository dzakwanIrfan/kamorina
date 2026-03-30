export interface MonthlyLoanData {
  sisaPinjaman: number;
  bunga: number;
  angsuran: number;
}

export interface MonthMeta {
  key: string;
  label: string;
}

export interface LoanBalanceRow {
  noAnggota: string;
  nama: string;
  totalBungaPrevYear: number;
  monthlyData: Record<string, MonthlyLoanData>;
  totalBungaCurrentYear: number;
}

export interface LoanBalanceTotals {
  totalBungaPrevYear: number;
  monthlyTotals: Record<string, MonthlyLoanData>;
  totalBungaCurrentYear: number;
}

export interface LoanBalanceReport {
  year: number;
  prevYear: number;
  months: MonthMeta[];
  rows: LoanBalanceRow[];
  totals: LoanBalanceTotals;
}

export interface QueryLoanBalanceReportParams {
  year?: number;
}
