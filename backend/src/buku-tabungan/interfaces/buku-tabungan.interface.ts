import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;

export interface SaldoSummary {
  saldoPokok: Decimal;
  saldoWajib: Decimal;
  saldoSukarela: Decimal;
  bungaDeposito: Decimal;
  totalSaldo: Decimal;
}

export interface TransactionSummary {
  totalIuranPendaftaran: Decimal;
  totalIuranBulanan: Decimal;
  totalTabunganDeposito: Decimal;
  totalShu: Decimal;
  totalPenarikan: Decimal;
  totalBunga: Decimal;
}

export interface BukuTabunganResponse {
  account: {
    id: string;
    userId: string;
    user: {
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
    };
    saldoPokok: Decimal;
    saldoWajib: Decimal;
    saldoSukarela: Decimal;
    bungaDeposito: Decimal;
    createdAt: Date;
    updatedAt: Date;
  };
  summary: SaldoSummary;
  transactionSummary?: TransactionSummary;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  payrollPeriodId?: string;
  month?: number;
  year?: number;
}

/**
 * Item response for list all savings accounts
 */
export interface BukuTabunganListItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    employee: {
      employeeNumber: string;
      fullName: string;
      employeeType: string;
      department: {
        id: string;
        departmentName: string;
      };
      golongan: {
        id: string;
        golonganName: string;
      };
    };
  };
  saldoPokok: Decimal;
  saldoWajib: Decimal;
  saldoSukarela: Decimal;
  bungaDeposito: Decimal;
  totalSaldo: Decimal;
  createdAt: Date;
  updatedAt: Date;
}
