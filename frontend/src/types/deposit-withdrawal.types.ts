export enum DepositWithdrawalStatus {
    SUBMITTED = 'SUBMITTED',
    UNDER_REVIEW_DSP = 'UNDER_REVIEW_DSP',
    UNDER_REVIEW_KETUA = 'UNDER_REVIEW_KETUA',
    APPROVED_WAITING_DISBURSEMENT = 'APPROVED_WAITING_DISBURSEMENT',
    DISBURSEMENT_IN_PROGRESS = 'DISBURSEMENT_IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export enum DepositWithdrawalStep {
    DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
    KETUA = 'KETUA',
    SHOPKEEPER = 'SHOPKEEPER',
    KETUA_AUTH = 'KETUA_AUTH',
}

export interface DepositWithdrawalApproval {
    id: string;
    step: DepositWithdrawalStep;
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

export interface DepositWithdrawalDisbursement {
    id: string;
    transactionDate: string;
    notes: string | null;
    createdAt: string;
    processedByUser: {
        id: string;
        name: string;
        email: string;
    };
}

export interface DepositWithdrawalAuthorization {
    id: string;
    authorizationDate: string;
    notes: string | null;
    createdAt: string;
    authorizedByUser: {
        id: string;
        name: string;
        email: string;
    };
}

export interface DepositWithdrawal {
    id: string;
    withdrawalNumber: string;
    depositApplicationId: string;
    userId: string;
    withdrawalAmount: number;
    isEarlyWithdrawal: boolean;
    penaltyRate: number;
    penaltyAmount: number;
    netAmount: number;
    bankAccountNumber: string | null;
    notes: string | null;
    status: DepositWithdrawalStatus;
    currentStep: DepositWithdrawalStep | null;
    submittedAt: string | null;
    rejectedAt: string | null;
    completedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    depositApplication?: {
        id: string;
        depositNumber: string;
        amountValue: number;
        tenorMonths: number;
        collectedAmount: number;
        maturityDate: string | null;
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
        };
    };
    approvals: DepositWithdrawalApproval[];
    disbursement?: DepositWithdrawalDisbursement;
    authorization?: DepositWithdrawalAuthorization;
}

export interface CreateDepositWithdrawalDto {
    depositApplicationId: string;
    withdrawalAmount: number;
    bankAccountNumber?: string;
    notes?: string;
}

export interface ApproveWithdrawalDto {
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
}

export interface BulkApproveWithdrawalDto {
    withdrawalIds: string[];
    decision: 'APPROVED' | 'REJECTED';
    notes?: string;
}

export interface ConfirmDisbursementDto {
    transactionDate?: string;
    notes?: string;
}

export interface ConfirmAuthorizationDto {
    authorizationDate?: string;
    notes?: string;
}

export interface QueryWithdrawalParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: DepositWithdrawalStatus;
    step?: DepositWithdrawalStep;
    userId?: string;
    depositApplicationId?: string;
    startDate?: string;
    endDate?: string;
}