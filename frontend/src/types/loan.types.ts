import { User } from "./auth.types";

export enum LoanType {
  CASH_LOAN = "CASH_LOAN",
  GOODS_REIMBURSE = "GOODS_REIMBURSE",
  GOODS_ONLINE = "GOODS_ONLINE",
  GOODS_PHONE = "GOODS_PHONE",
}

export enum LoanStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW_DSP = "UNDER_REVIEW_DSP",
  UNDER_REVIEW_KETUA = "UNDER_REVIEW_KETUA",
  UNDER_REVIEW_PENGAWAS = "UNDER_REVIEW_PENGAWAS",
  APPROVED_PENDING_DISBURSEMENT = "APPROVED_PENDING_DISBURSEMENT",
  DISBURSEMENT_IN_PROGRESS = "DISBURSEMENT_IN_PROGRESS",
  PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION",
  DISBURSED = "DISBURSED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum LoanApprovalStep {
  DIVISI_SIMPAN_PINJAM = "DIVISI_SIMPAN_PINJAM",
  KETUA = "KETUA",
  PENGAWAS = "PENGAWAS",
}

export enum LoanApprovalDecision {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REVISED = "REVISED",
}

// Type-specific details interfaces
export interface CashLoanDetail {
  id: string;
  loanApplicationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReimburseDetail {
  id: string;
  loanApplicationId: string;
  itemName: string;
  itemPrice: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsOnlineDetail {
  id: string;
  loanApplicationId: string;
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  shopMarginRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsPhoneDetail {
  id: string;
  loanApplicationId: string;
  itemName: string;
  retailPrice: number;
  cooperativePrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanEligibility {
  isEligible: boolean;
  employee: {
    employeeNumber: string;
    fullName: string;
    employeeType: "TETAP" | "KONTRAK";
    department: string;
    golongan: string;
  };
  yearsOfService: number;
  loanLimit: {
    minLoanAmount: number;
    maxLoanAmount: number;
    maxTenor: number;
    interestRate: number;
  };
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
  loanType: LoanType;
  loanAmount: number;
  loanTenor: number;
  loanPurpose: string;
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

export interface LoanInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: number | null;
  notes: string | null;
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  loanNumber: string;
  userId: string;
  loanType: LoanType;
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
  user?: User;
  approvals: LoanApproval[];
  history?: LoanHistory[];
  disbursement?: LoanDisbursement | null;
  authorization?: LoanAuthorization | null;
  cashLoanDetails?: CashLoanDetail | null;
  goodsReimburseDetails?: GoodsReimburseDetail | null;
  goodsOnlineDetails?: GoodsOnlineDetail | null;
  goodsPhoneDetails?: GoodsPhoneDetail | null;
  loanInstallments?: LoanInstallment[];
}

// Create DTOs
export interface CreateCashLoanDto {
  loanType: LoanType.CASH_LOAN;
  loanAmount: number;
  loanTenor: number;
  loanPurpose: string;
  attachments?: string[];
  notes?: string;
}

export interface CreateGoodsReimburseDto {
  loanType: LoanType.GOODS_REIMBURSE;
  itemName: string;
  itemPrice: number;
  purchaseDate: string;
  loanTenor: number;
  loanPurpose: string;
  attachments?: string[];
  notes?: string;
}

export interface CreateGoodsOnlineDto {
  loanType: LoanType.GOODS_ONLINE;
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  loanTenor: number;
  loanPurpose: string;
  attachments?: string[];
  notes?: string;
}

export interface CreateGoodsPhoneDto {
  loanType: LoanType.GOODS_PHONE;
  itemName: string;
  loanTenor: number;
  loanPurpose: string;
  attachments?: string[];
  notes?: string;
}

export type CreateLoanDto =
  | CreateCashLoanDto
  | CreateGoodsReimburseDto
  | CreateGoodsOnlineDto
  | CreateGoodsPhoneDto;

// Update DTOs
export type UpdateCashLoanDto = Partial<Omit<CreateCashLoanDto, "loanType">>;
export type UpdateGoodsReimburseDto = Partial<
  Omit<CreateGoodsReimburseDto, "loanType">
>;
export type UpdateGoodsOnlineDto = Partial<
  Omit<CreateGoodsOnlineDto, "loanType">
>;
export type UpdateGoodsPhoneDto = Partial<
  Omit<CreateGoodsPhoneDto, "loanType">
>;

export type UpdateLoanDto =
  | UpdateCashLoanDto
  | UpdateGoodsReimburseDto
  | UpdateGoodsOnlineDto
  | UpdateGoodsPhoneDto;

// Revise DTOs
export interface ReviseCashLoanDto {
  loanAmount: number;
  loanTenor: number;
  revisionNotes: string;
}

export interface ReviseGoodsReimburseDto {
  itemPrice: number;
  loanTenor: number;
  revisionNotes: string;
}

export interface ReviseGoodsOnlineDto {
  itemPrice: number;
  loanTenor: number;
  revisionNotes: string;
}

export interface ReviseGoodsPhoneDto {
  retailPrice: number;
  cooperativePrice: number;
  loanTenor: number;
  revisionNotes: string;
}

export type ReviseLoanDto =
  | ReviseCashLoanDto
  | ReviseGoodsReimburseDto
  | ReviseGoodsOnlineDto
  | ReviseGoodsPhoneDto;

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
  sortOrder?: "asc" | "desc";
  status?: LoanStatus;
  step?: LoanApprovalStep;
  loanType?: LoanType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}
