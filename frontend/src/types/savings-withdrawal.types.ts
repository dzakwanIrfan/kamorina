import { User } from "./auth.types";

export enum SavingsWithdrawalStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW_DSP = 'UNDER_REVIEW_DSP',
    UNDER_REVIEW_KETUA = 'UNDER_REVIEW_KETUA',
    APPROVED_WAITING_DISBURSEMENT = 'APPROVED_WAITING_DISBURSEMENT',
    DISBURSEMENT_IN_PROGRESS = 'DISBURSEMENT_IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export enum SavingsWithdrawalStep {
    DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
    KETUA = 'KETUA',
    SHOPKEEPER = 'SHOPKEEPER',
    KETUA_AUTH = 'KETUA_AUTH',
}

export interface SavingsWithdrawalApproval {
    id: string;
    step: SavingsWithdrawalStep;
    decision: 'APPROVED' | 'REJECTED' | null;
    decidedAt: string | null;
    notes: string | null;
    createdAt: string;
    approver?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export interface SavingsWithdrawalDisbursement {
    id: string;
    disbursementDate: string;
    disbursementTime?: string;
    notes: string | null;
    createdAt: string;
    processedByUser: {
        id: string;
        name: string;
        email: string;
    };
}

export interface SavingsWithdrawalAuthorization {
    id: string;
    authorizationDate: string;
    authorizationTime?: string;
    notes: string | null;
    createdAt: string;
    authorizedByUser: {
        id: string;
        name: string;
        email: string;
    };
}

export interface SavingsWithdrawal {
    id: string;
    withdrawalNumber: string;
    userId: string;
    withdrawalAmount: number;
    hasEarlyDepositPenalty: boolean;
    penaltyRate: number;
    penaltyAmount: number;
    netAmount: number;
    notes: string | null;
    status: SavingsWithdrawalStatus;
    currentStep: SavingsWithdrawalStep | null;
    submittedAt: string | null;
    rejectedAt: string | null;
    completedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    user?: User;
    approvals: SavingsWithdrawalApproval[];
    disbursement?: SavingsWithdrawalDisbursement;
    authorization?: SavingsWithdrawalAuthorization;
}

export interface CreateSavingsWithdrawalDto {
    withdrawalAmount: number;
    notes?: string;
}

export interface ApproveSavingsWithdrawalDto {
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
}

export interface BulkApproveSavingsWithdrawalDto {
    withdrawalIds: string[];
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
}

export interface ConfirmDisbursementDto {
    disbursementDate?: string;
    disbursementTime?: string;
    notes?: string;
}


export interface BulkConfirmDisbursementDto {
    withdrawalIds: string[];
    disbursementDate?: string;
    disbursementTime?: string;
    notes?: string;
}

export interface ConfirmAuthorizationDto {
    authorizationDate?: string;
    authorizationTime?: string;
    notes?: string;
}

export interface BulkConfirmAuthorizationDto {
    withdrawalIds: string[];
    authorizationDate?: string;
    authorizationTime?: string;
    notes?: string;
}


export interface QuerySavingsWithdrawalParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: SavingsWithdrawalStatus;
    step?: SavingsWithdrawalStep;
    userId?: string;
    startDate?: string;
    endDate?: string;
}