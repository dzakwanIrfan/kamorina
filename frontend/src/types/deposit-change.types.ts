export enum DepositChangeType {
  AMOUNT_CHANGE = 'AMOUNT_CHANGE',
  TENOR_CHANGE = 'TENOR_CHANGE',
  BOTH = 'BOTH',
}

export enum DepositChangeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW_DSP = 'UNDER_REVIEW_DSP',
  UNDER_REVIEW_KETUA = 'UNDER_REVIEW_KETUA',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum DepositChangeApprovalStep {
  DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
  KETUA = 'KETUA',
}

export enum DepositChangeApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface DepositChangeApproval {
  id: string;
  step: DepositChangeApprovalStep;
  decision: DepositChangeApprovalDecision | null;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DepositChangeHistory {
  id: string;
  status: DepositChangeStatus;
  changeType: DepositChangeType;
  currentAmountValue: number;
  currentTenorMonths: number;
  newAmountValue: number;
  newTenorMonths: number;
  adminFee: number;
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

export interface DepositChangeRequest {
  id: string;
  changeNumber: string;
  depositApplicationId: string;
  userId: string;
  changeType: DepositChangeType;
  
  // Current values
  currentAmountCode: string;
  currentTenorCode: string;
  currentAmountValue: number;
  currentTenorMonths: number;
  currentInterestRate: number | null;
  currentProjectedInterest: number | null;
  currentTotalReturn: number | null;
  
  // New values
  newAmountCode: string;
  newTenorCode: string;
  newAmountValue: number;
  newTenorMonths: number;
  newInterestRate: number | null;
  newProjectedInterest: number | null;
  newTotalReturn: number | null;
  
  adminFee: number;
  agreedToTerms: boolean;
  agreedToAdminFee: boolean;
  
  status: DepositChangeStatus;
  currentStep: DepositChangeApprovalStep | null;
  
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  effectiveDate: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  depositApplication?: {
    id: string;
    depositNumber: string;
    amountValue: number;
    tenorMonths: number;
    status: string;
  };
  
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
  
  approvals: DepositChangeApproval[];
  history?: DepositChangeHistory[];
  
  comparison?: {
    current: {
      amountCode: string;
      tenorCode: string;
      principal: number;
      tenorMonths: number;
      projectedInterest: number;
      totalReturn: number;
    };
    new: {
      amountCode: string;
      tenorCode: string;
      principal: number;
      tenorMonths: number;
      projectedInterest: number;
      totalReturn: number;
    };
    difference: {
      amount: number;
      tenor: number;
      projectedInterest: number;
      totalReturn: number;
    };
    adminFee: number;
  };
}

export interface CreateDepositChangeDto {
  depositApplicationId: string;
  newAmountCode: string;
  newTenorCode: string;
  agreedToTerms: boolean;
  agreedToAdminFee: boolean;
  notes?: string;
}

export interface UpdateDepositChangeDto {
  newAmountCode?: string;
  newTenorCode?: string;
  agreedToTerms?: boolean;
  agreedToAdminFee?: boolean;
}

export interface ApproveDepositChangeDto {
  decision: DepositChangeApprovalDecision;
  notes?: string;
}

export interface BulkApproveDepositChangeDto {
  changeRequestIds: string[];
  decision: DepositChangeApprovalDecision;
  notes?: string;
}

export interface QueryDepositChangeParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: DepositChangeStatus;
  step?: DepositChangeApprovalStep;
  changeType?: DepositChangeType;
  userId?: string;
  depositApplicationId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DepositChangePreview {
  current: {
    amountCode: string;
    tenorCode: string;
    principal: number;
    tenorMonths: number;
    annualInterestRate: number;
    projectedInterest: number;
    totalReturn: number;
  };
  new: {
    amountCode: string;
    tenorCode: string;
    principal: number;
    tenorMonths: number;
    annualInterestRate: number;
    projectedInterest: number;
    totalReturn: number;
  };
  difference: {
    amount: number;
    tenor: number;
    projectedInterest: number;
    totalReturn: number;
  };
  adminFee: number;
  changeType: DepositChangeType | null;
  hasChanges: boolean;
}