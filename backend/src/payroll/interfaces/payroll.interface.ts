import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

export interface PayrollSettings {
  cutoffDate: number;
  payrollDate: number;
  monthlyMembershipFee: Prisma.Decimal;
  depositInterestRate: number;
  initialMembershipFee: Prisma.Decimal;
}

export interface PayrollContext {
  settings: PayrollSettings;
  payrollPeriodId: string;
  cutoffStart: dayjs.Dayjs;
  cutoffEnd: dayjs.Dayjs;
  processDate: dayjs.Dayjs;
}

export interface ProcessorResult {
  processedCount: number;
  totalAmount: Prisma.Decimal;
  errors: ProcessorError[];
  details: ProcessorDetail[];
}

export interface ProcessorError {
  userId?: string;
  entityId?: string;
  entityType: string;
  message: string;
  stack?: string;
}

export interface ProcessorDetail {
  userId: string;
  userName?: string;
  type: TransactionType;
  amount: Prisma.Decimal;
  description: string;
}

export type TransactionType =
  | 'IURAN_PENDAFTARAN'
  | 'IURAN_BULANAN'
  | 'TABUNGAN_DEPOSITO'
  | 'ANGSURAN_PINJAMAN'
  | 'BUNGA_SIMPANAN'
  | 'PENARIKAN'
  | 'PELUNASAN_PINJAMAN'
  | 'SHU';

export interface PayrollSummary {
  periodId: string;
  periodName: string;
  processedAt: Date;
  membership: ProcessorResult;
  mandatorySavings: ProcessorResult;
  depositSavings: ProcessorResult;
  savingsWithdrawal: ProcessorResult;
  loanRepayment: ProcessorResult;
  loanInstallment: ProcessorResult;
  interest: ProcessorResult;
  grandTotal: Prisma.Decimal;
}
