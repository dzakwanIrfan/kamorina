import { User } from "./auth.types";
import { LoanApplication } from "./loan.types";

export enum RepaymentStatus {
  UNDER_REVIEW_DSP = "UNDER_REVIEW_DSP",
  UNDER_REVIEW_KETUA = "UNDER_REVIEW_KETUA",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export enum RepaymentApprovalStep {
  DIVISI_SIMPAN_PINJAM = "DIVISI_SIMPAN_PINJAM",
  KETUA = "KETUA",
}

export enum ApprovalDecision {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface RepaymentApproval {
  id: string;
  repaymentId: string;
  step: RepaymentApprovalStep;
  decision: ApprovalDecision | null;
  decidedAt: string | null;
  notes: string | null;
  approverId: string | null;
  createdAt: string;
  updatedAt: string;
  approver?: User
}

export interface LoanRepayment {
  id: string;
  repaymentNumber: string;
  loanApplicationId: string;
  userId: string;
  totalAmount: number;
  status: RepaymentStatus;
  currentStep: RepaymentApprovalStep | null;
  isAgreedByMember: boolean;
  agreedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  loanApplication?: LoanApplication;
  approvals?: RepaymentApproval[];
  user?: User;
}

export interface RepaymentCalculation {
  loanId: string;
  totalLoanAmount: number;
  totalPaid: number;
  remainingAmount: number;
  remainingInstallments: number;
  paidInstallments: number;
  totalInstallments: number;
}

// DTOs
export interface CreateRepaymentDto {
  loanApplicationId: string;
  isAgreedByMember: boolean;
}

export interface ApproveRepaymentDto {
  decision: ApprovalDecision;
  notes?: string;
}

export interface BulkApproveRepaymentDto {
  repaymentIds: string[];
  decision: ApprovalDecision;
  notes?: string;
}

export interface QueryRepaymentParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: RepaymentStatus;
  step?: RepaymentApprovalStep;
  userId?: string;
  loanApplicationId?: string;
  startDate?: string;
  endDate?: string;
}
