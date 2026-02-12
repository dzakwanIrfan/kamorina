/**
 * Dashboard Types for Frontend
 * Matches backend DashboardSummaryDto structure
 */

export interface UserGreeting {
  name: string;
  employeeNumber: string;
  avatar: string | null;
}

export interface NextBill {
  dueDate: string;
  amount: string;
  loanNumber: string;
  daysUntilDue: number;
}

export interface FinancialSummary {
  /** Total savings = saldoPokok + saldoWajib + saldoSukarela */
  totalSavings: string;
  /** Sum of active deposit amounts */
  activeDeposits: string;
  /** Remaining loan amount to pay */
  remainingLoan: string;
  /** Next bill information */
  nextBill: NextBill | null;
}

export type ActivityType = 'loan' | 'deposit' | 'withdrawal' | 'repayment';

export interface ActivityItem {
  type: ActivityType;
  id: string;
  title: string;
  status: string;
  date: string;
  amount: string;
  applicantName?: string;
  currentStep?: string;
}

export interface ChartDataPoint {
  month: string;
  income: string;
  expense: string;
}

export interface RecentTransaction {
  id: string;
  transactionDate: string;
  note: string | null;
  iuranPendaftaran: string;
  iuranBulanan: string;
  tabunganDeposito: string;
  shu: string;
  penarikan: string;
  bunga: string;
  jumlahBunga: string;
  periodMonth: number | null;
  periodYear: number | null;
}

export interface DashboardSummary {
  greeting: UserGreeting;
  financialSummary: FinancialSummary;
  activities: ActivityItem[];
  chartData: ChartDataPoint[];
  recentTransactions: RecentTransaction[];
  isApprover: boolean;
  approverRoles: string[];
}

/**
 * Status display mappings for UI
 */
export const STATUS_LABELS: Record<string, string> = {
  // Loan Statuses
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  UNDER_REVIEW_DSP: 'Review DSP',
  UNDER_REVIEW_KETUA: 'Review Ketua',
  UNDER_REVIEW_PENGAWAS: 'Review Pengawas',
  APPROVED_PENDING_DISBURSEMENT: 'Menunggu Pencairan',
  DISBURSEMENT_IN_PROGRESS: 'Proses Pencairan',
  PENDING_AUTHORIZATION: 'Menunggu Otorisasi',
  DISBURSED: 'Dicairkan',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
  // Deposit Statuses
  ACTIVE: 'Aktif',
  // Withdrawal Statuses
  APPROVED_WAITING_DISBURSEMENT: 'Menunggu Pencairan',
  // Repayment Statuses
  APPROVED: 'Disetujui',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'default',
  UNDER_REVIEW_DSP: 'default',
  UNDER_REVIEW_KETUA: 'default',
  UNDER_REVIEW_PENGAWAS: 'default',
  APPROVED_PENDING_DISBURSEMENT: 'default',
  DISBURSEMENT_IN_PROGRESS: 'default',
  PENDING_AUTHORIZATION: 'default',
  DISBURSED: 'secondary',
  COMPLETED: 'outline',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
  ACTIVE: 'secondary',
  APPROVED_WAITING_DISBURSEMENT: 'default',
  APPROVED: 'secondary',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  loan: 'Pinjaman',
  deposit: 'Deposito',
  withdrawal: 'Penarikan',
  repayment: 'Pelunasan',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  loan: 'bg-blue-500',
  deposit: 'bg-green-500',
  withdrawal: 'bg-orange-500',
  repayment: 'bg-purple-500',
};
