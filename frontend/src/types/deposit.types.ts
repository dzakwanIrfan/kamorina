export enum DepositStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW_DSP = 'UNDER_REVIEW_DSP',
  UNDER_REVIEW_KETUA = 'UNDER_REVIEW_KETUA',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum DepositApprovalStep {
  DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
  KETUA = 'KETUA',
}

export enum DepositApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface DepositApproval {
  id: string;
  step: DepositApprovalStep;
  decision: DepositApprovalDecision | null;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DepositHistory {
  id: string;
  status: DepositStatus;
  depositAmountCode: string;
  depositTenorCode: string;
  amountValue: number;
  tenorMonths: number;
  interestRate: number | null;
  projectedInterest: number | null;
  action: string;
  actionAt: string;
  notes: string | null;
  actionByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface DepositApplication {
  id: string;
  depositNumber: string;
  userId: string;
  depositAmountCode: string;
  depositTenorCode: string;
  amountValue: number;
  tenorMonths: number;
  interestRate: number | null;
  agreedToTerms: boolean;
  status: DepositStatus;
  currentStep: DepositApprovalStep | null;
  submittedAt: string | null;
  approvedAt: string | null;
  activatedAt: string | null;
  maturityDate: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    employee: {
      id: string;
      employeeNumber: string;
      fullName: string;
      department?: {
        id: string;
        departmentName: string;
      };
      golongan?: {
        id: string;
        golonganName: string;
      };
    };
  };
  approvals: DepositApproval[];
  history?: DepositHistory[];
}

export interface CreateDepositDto {
  depositAmountCode: string;
  depositTenorCode: string;
  agreedToTerms: boolean;
}

export interface UpdateDepositDto {
  depositAmountCode?: string;
  depositTenorCode?: string;
  agreedToTerms?: boolean;
}

export interface ApproveDepositDto {
  decision: DepositApprovalDecision;
  notes?: string;
}

export interface BulkApproveDepositDto {
  depositIds: string[];
  decision: DepositApprovalDecision;
  notes?: string;
}

export interface QueryDepositParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: DepositStatus;
  step?: DepositApprovalStep;
  userId?: string;
  startDate?: string;
  endDate?: string;
}