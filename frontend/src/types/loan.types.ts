export enum LoanStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW_DSP = 'UNDER_REVIEW_DSP',
  UNDER_REVIEW_KETUA = 'UNDER_REVIEW_KETUA',
  UNDER_REVIEW_PENGAWAS = 'UNDER_REVIEW_PENGAWAS',
  APPROVED_PENDING_DISBURSEMENT = 'APPROVED_PENDING_DISBURSEMENT',
  DISBURSEMENT_IN_PROGRESS = 'DISBURSEMENT_IN_PROGRESS',
  PENDING_AUTHORIZATION = 'PENDING_AUTHORIZATION',
  DISBURSED = 'DISBURSED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum LoanApprovalStep {
  DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
  KETUA = 'KETUA',
  PENGAWAS = 'PENGAWAS',
}

export enum LoanApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
}

export interface LoanApproval {
  id: string;
  step: LoanApprovalStep;
  decision: LoanApprovalDecision | null;
  decidedAt: string | null;
  notes: string | null;
  revisedData: any | null;
  createdAt: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface LoanHistory {
  id: string;
  status: LoanStatus;
  loanAmount: number;
  loanTenor: number;
  loanPurpose: string;
  bankAccountNumber: string;
  interestRate: number | null;
  monthlyInstallment: number | null;
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

export interface LoanDisbursement {
  id: string;
  disbursementDate: string;
  disbursementTime: string;
  notes: string | null;
  createdAt: string;
  processedByUser: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoanAuthorization {
  id: string;
  authorizationDate: string;
  authorizationTime: string;
  notes: string | null;
  createdAt: string;
  authorizedByUser: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LoanApplication {
  id: string;
  loanNumber: string;
  userId: string;
  bankAccountNumber: string;
  loanAmount: number;
  loanTenor: number;
  loanPurpose: string;
  attachments: string[] | null;
  interestRate: number | null;
  monthlyInstallment: number | null;
  totalRepayment: number | null;
  status: LoanStatus;
  currentStep: LoanApprovalStep | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  disbursedAt: string | null;
  rejectionReason: string | null;
  revisionCount: number;
  lastRevisedAt: string | null;
  lastRevisedBy: string | null;
  revisionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    bankAccountNumber: string | null;
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
  approvals: LoanApproval[];
  history?: LoanHistory[];
  disbursement?: LoanDisbursement | null;
  authorization?: LoanAuthorization | null;
}

export interface CreateLoanDto {
  bankAccountNumber?: string;
  loanAmount: number;
  loanTenor: number;
  loanPurpose: string;
  attachments?: string[];
}

export interface UpdateLoanDto {
  bankAccountNumber?: string;
  loanAmount?: number;
  loanTenor?: number;
  loanPurpose?: string;
  attachments?: string[];
}

export interface ReviseLoanDto {
  loanAmount: number;
  loanTenor: number;
  revisionNotes: string;
}

export interface ApproveLoanDto {
  decision: LoanApprovalDecision;
  notes?: string;
}

export interface BulkApproveLoanDto {
  loanIds: string[];
  decision: LoanApprovalDecision;
  notes?: string;
}

export interface ProcessDisbursementDto {
  disbursementDate: string;
  disbursementTime: string;
  notes?: string;
}

export interface BulkProcessDisbursementDto {
  loanIds: string[];
  disbursementDate: string;
  disbursementTime: string;
  notes?: string;
}

export interface ProcessAuthorizationDto {
  authorizationDate: string;
  authorizationTime: string;
  notes?: string;
}

export interface BulkProcessAuthorizationDto {
  loanIds: string[];
  authorizationDate: string;
  authorizationTime: string;
  notes?: string;
}

export interface QueryLoanParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: LoanStatus;
  step?: LoanApprovalStep;
  userId?: string;
  startDate?: string;
  endDate?: string;
}