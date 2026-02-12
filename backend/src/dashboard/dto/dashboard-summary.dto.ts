/**
 * User greeting information displayed in dashboard header
 */
export class UserGreetingDto {
  name: string;
  employeeNumber: string;
  avatar: string | null;
}

/**
 * Financial summary for the 4 main dashboard cards
 */
export class FinancialSummaryDto {
  /**
   * Total savings = saldoPokok + saldoWajib + saldoSukarela
   * From SavingsAccount model
   */
  totalSavings: string;

  /**
   * Sum of amountValue from active DepositApplications
   * Where status = ACTIVE
   */
  activeDeposits: string;

  /**
   * Remaining loan amount = totalRepayment - paidAmount
   * Calculated from active LoanApplications (status DISBURSED)
   */
  remainingLoan: string;

  /**
   * Next upcoming bill information
   * From nearest LoanInstallment with isPaid = false
   */
  nextBill: NextBillDto | null;
}

/**
 * Next bill details
 */
export class NextBillDto {
  dueDate: Date;
  amount: string;
  loanNumber: string;
  daysUntilDue: number;
}

/**
 * Polymorphic activity item for workflow widget
 * Can represent Loan, Deposit, or Withdrawal applications
 */
export class ActivityItemDto {
  /**
   * Type of activity: 'loan' | 'deposit' | 'withdrawal' | 'repayment'
   */
  type: 'loan' | 'deposit' | 'withdrawal' | 'repayment';

  /**
   * Unique identifier for the application
   */
  id: string;

  /**
   * Display title (e.g., loan number, deposit number)
   */
  title: string;

  /**
   * Current status of the application
   */
  status: string;

  /**
   * Relevant date (submitted or updated)
   */
  date: Date;

  /**
   * Amount involved (formatted as string)
   */
  amount: string;

  /**
   * For approvers: Name of the applicant
   */
  applicantName?: string;

  /**
   * Current approval step if applicable
   */
  currentStep?: string;
}

/**
 * Monthly chart data point for savings growth
 */
export class ChartDataPointDto {
  /**
   * Month label (e.g., "Jan 2026")
   */
  month: string;

  /**
   * Total income for the month
   * (iuranPendaftaran + iuranBulanan + tabunganDeposito + shu + bunga)
   */
  income: string;

  /**
   * Total expense for the month
   * (penarikan)
   */
  expense: string;
}

/**
 * Recent transaction item for the bottom table
 */
export class RecentTransactionDto {
  id: string;
  transactionDate: Date;
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

/**
 * Main Dashboard Summary Response DTO
 */
export class DashboardSummaryDto {
  /**
   * User greeting information
   */
  greeting: UserGreetingDto;

  /**
   * Financial summary for 4 cards
   */
  financialSummary: FinancialSummaryDto;

  /**
   * Activity items based on user role
   * - Regular member: Their own pending applications
   * - Approver: Others' applications waiting for their approval step
   */
  activities: ActivityItemDto[];

  /**
   * Chart data for last 6 months
   */
  chartData: ChartDataPointDto[];

  /**
   * Last 5 transactions
   */
  recentTransactions: RecentTransactionDto[];

  /**
   * Indicates if user is an approver
   * Used by frontend to show appropriate UI
   */
  isApprover: boolean;

  /**
   * User's approval roles if any
   */
  approverRoles: string[];
}
