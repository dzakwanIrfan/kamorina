export interface CashLoanData {
  angsuran: number;
  jumlahPinjaman: number;
  start: string | null;
  finish: string | null;
}

export interface GoodsLoanData {
  angsuran: number;
  jumlahPinjaman: number;
  start: string | null;
  finish: string | null;
}

export interface RepaymentData {
  pelunasan: number;
  sisaLamaPinjaman: string | null;
}

export interface SalaryDeductionRow {
  nama: string;
  dept: string;
  pendaftaran: number;
  tabunganDeposito: number;
  penarikan: number;
  cashLoan: CashLoanData;
  pelunasanPinjaman: RepaymentData;
  goodsLoan: GoodsLoanData;
}

export interface SalaryDeductionTotals {
  pendaftaran: number;
  tabunganDeposito: number;
  penarikan: number;
  cashLoanAngsuran: number;
  cashLoanJumlahPinjaman: number;
  pelunasan: number;
  goodsLoanAngsuran: number;
  goodsLoanJumlahPinjaman: number;
}

export interface SalaryDeductionReport {
  period: {
    month: number;
    year: number;
    name: string;
  };
  rows: SalaryDeductionRow[];
  totals: SalaryDeductionTotals;
}

export interface QuerySalaryDeductionReportParams {
  month?: number;
  year?: number;
}
