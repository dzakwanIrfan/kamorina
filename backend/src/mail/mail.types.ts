/**
 * Enum untuk jenis email yang didukung
 */
export enum EmailJobType {
    // Auth
    EMAIL_VERIFICATION = 'email_verification',
    PASSWORD_RESET = 'password_reset',

    // Member Application
    APPROVAL_REQUEST = 'approval_request',
    APPLICATION_REJECTED = 'application_rejected',
    MEMBERSHIP_APPROVED = 'membership_approved',
    NEW_MEMBER_NOTIFICATION = 'new_member_notification',

    // Loan
    LOAN_APPROVAL_REQUEST = 'loan_approval_request',
    LOAN_REVISED = 'loan_revised',
    LOAN_REJECTED = 'loan_rejected',
    LOAN_DISBURSEMENT_REQUEST = 'loan_disbursement_request',
    LOAN_AUTHORIZATION_REQUEST = 'loan_authorization_request',
    LOAN_DISBURSED = 'loan_disbursed',
    LOAN_COMPLETION_NOTIFICATION = 'loan_completion_notification',

    // Deposit
    DEPOSIT_APPROVAL_REQUEST = 'deposit_approval_request',
    DEPOSIT_REJECTED = 'deposit_rejected',
    DEPOSIT_APPROVED = 'deposit_approved',
    DEPOSIT_PAYROLL_NOTIFICATION = 'deposit_payroll_notification',

    // Deposit Change
    DEPOSIT_CHANGE_APPROVAL_REQUEST = 'deposit_change_approval_request',
    DEPOSIT_CHANGE_REJECTED = 'deposit_change_rejected',
    DEPOSIT_CHANGE_APPROVED = 'deposit_change_approved',
    DEPOSIT_CHANGE_PAYROLL_NOTIFICATION = 'deposit_change_payroll_notification',
    DEPOSIT_CHANGE_EMPLOYEE_NOTIFICATION = 'deposit_change_employee_notification',

    // Savings Withdrawal
    SAVINGS_WITHDRAWAL_APPROVAL_REQUEST = 'savings_withdrawal_approval_request',
    SAVINGS_WITHDRAWAL_REJECTED = 'savings_withdrawal_rejected',
    SAVINGS_WITHDRAWAL_DISBURSEMENT_REQUEST = 'savings_withdrawal_disbursement_request',
    SAVINGS_WITHDRAWAL_AUTHORIZATION_REQUEST = 'savings_withdrawal_authorization_request',
    SAVINGS_WITHDRAWAL_APPROVED = 'savings_withdrawal_approved',
    SAVINGS_WITHDRAWAL_COMPLETED = 'savings_withdrawal_completed',

    // Generic
    GENERIC_EMAIL = 'generic_email',
}

/**
 * Base interface untuk semua email job
 */
export interface BaseEmailJob {
    type: EmailJobType;
    to: string;
    attemptsMade?: number;
}

/**
 * Email Verification Job
 */
export interface EmailVerificationJob extends BaseEmailJob {
    type: EmailJobType.EMAIL_VERIFICATION;
    data: {
        name: string;
        token: string;
    };
}

/**
 * Password Reset Job
 */
export interface PasswordResetJob extends BaseEmailJob {
    type: EmailJobType.PASSWORD_RESET;
    data: {
        name: string;
        token: string;
    };
}

/**
 * Approval Request Job (Member Application)
 */
export interface ApprovalRequestJob extends BaseEmailJob {
    type: EmailJobType.APPROVAL_REQUEST;
    data: {
        approverName: string;
        applicantName: string;
        employeeNumber: string;
        roleName: string;
    };
}

/**
 * Application Rejected Job
 */
export interface ApplicationRejectedJob extends BaseEmailJob {
    type: EmailJobType.APPLICATION_REJECTED;
    data: {
        applicantName: string;
        reason: string;
    };
}

/**
 * Membership Approved Job
 */
export interface MembershipApprovedJob extends BaseEmailJob {
    type: EmailJobType.MEMBERSHIP_APPROVED;
    data: {
        memberName: string;
    };
}

/**
 * New Member Notification Job
 */
export interface NewMemberNotificationJob extends BaseEmailJob {
    type: EmailJobType.NEW_MEMBER_NOTIFICATION;
    data: {
        recipientName: string;
        memberName: string;
        memberEmail: string;
    };
}

/**
 * Loan Approval Request Job
 */
export interface LoanApprovalRequestJob extends BaseEmailJob {
    type: EmailJobType.LOAN_APPROVAL_REQUEST;
    data: {
        approverName: string;
        applicantName: string;
        loanNumber: string;
        loanAmount: number;
        roleName: string;
    };
}

/**
 * Loan Revised Job
 */
export interface LoanRevisedJob extends BaseEmailJob {
    type: EmailJobType.LOAN_REVISED;
    data: {
        applicantName: string;
        loanNumber: string;
        revisionNotes: string;
    };
}

/**
 * Loan Rejected Job
 */
export interface LoanRejectedJob extends BaseEmailJob {
    type: EmailJobType.LOAN_REJECTED;
    data: {
        applicantName: string;
        loanNumber: string;
        reason: string;
    };
}

/**
 * Loan Disbursement Request Job
 */
export interface LoanDisbursementRequestJob extends BaseEmailJob {
    type: EmailJobType.LOAN_DISBURSEMENT_REQUEST;
    data: {
        shopkeeperName: string;
        applicantName: string;
        loanNumber: string;
        loanAmount: number;
        bankAccountNumber: string;
    };
}

/**
 * Loan Authorization Request Job
 */
export interface LoanAuthorizationRequestJob extends BaseEmailJob {
    type: EmailJobType.LOAN_AUTHORIZATION_REQUEST;
    data: {
        ketuaName: string;
        applicantName: string;
        loanNumber: string;
        loanAmount: number;
    };
}

/**
 * Loan Disbursed Job
 */
export interface LoanDisbursedJob extends BaseEmailJob {
    type: EmailJobType.LOAN_DISBURSED;
    data: {
        applicantName: string;
        loanNumber: string;
        loanAmount: number;
        bankAccountNumber: string;
    };
}

/**
 * Loan Completion Notification Job
 */
export interface LoanCompletionNotificationJob extends BaseEmailJob {
    type: EmailJobType.LOAN_COMPLETION_NOTIFICATION;
    data: {
        applicantName: string;
        loanNumber: string;
        loanAmount: number;
    };
}

/**
 * Deposit Approval Request Job
 */
export interface DepositApprovalRequestJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_APPROVAL_REQUEST;
    data: {
        approverName: string;
        applicantName: string;
        depositNumber: string;
        depositAmount: number;
        roleName: string;
    };
}

/**
 * Deposit Rejected Job
 */
export interface DepositRejectedJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_REJECTED;
    data: {
        applicantName: string;
        depositNumber: string;
        reason: string;
    };
}

/**
 * Deposit Approved Job
 */
export interface DepositApprovedJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_APPROVED;
    data: {
        applicantName: string;
        depositNumber: string;
        depositAmount: number;
        tenorMonths: number;
    };
}

/**
 * Deposit Payroll Notification Job
 */
export interface DepositPayrollNotificationJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_PAYROLL_NOTIFICATION;
    data: {
        payrollName: string;
        applicantName: string;
        depositNumber: string;
        depositAmount: number;
    };
}

/**
 * Deposit Change Approval Request Job
 */
export interface DepositChangeApprovalRequestJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_CHANGE_APPROVAL_REQUEST;
    data: {
        approverName: string;
        applicantName: string;
        changeNumber: string;
        depositNumber: string;
        currentAmount: number;
        newAmount: number;
        roleName: string;
    };
}

/**
 * Deposit Change Rejected Job
 */
export interface DepositChangeRejectedJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_CHANGE_REJECTED;
    data: {
        applicantName: string;
        changeNumber: string;
        depositNumber: string;
        reason: string;
    };
}

/**
 * Deposit Change Approved Job
 */
export interface DepositChangeApprovedJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_CHANGE_APPROVED;
    data: {
        applicantName: string;
        changeNumber: string;
        depositNumber: string;
        currentAmount: number;
        newAmount: number;
        currentTenor: number;
        newTenor: number;
        adminFee: number;
    };
}

/**
 * Deposit Change Payroll Notification Job
 */
export interface DepositChangePayrollNotificationJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_CHANGE_PAYROLL_NOTIFICATION;
    data: {
        payrollName: string;
        applicantName: string;
        changeNumber: string;
        depositNumber: string;
        currentAmount: number;
        newAmount: number;
        adminFee: number;
    };
}

/**
 * Deposit Change Employee Notification Job
 */
export interface DepositChangeEmployeeNotificationJob extends BaseEmailJob {
    type: EmailJobType.DEPOSIT_CHANGE_EMPLOYEE_NOTIFICATION;
    data: {
        employeeName: string;
        changeNumber: string;
        depositNumber: string;
        currentAmount: number;
        newAmount: number;
        currentTenor: number;
        newTenor: number;
        adminFee: number;
        effectiveDate: string; // ISO date string
    };
}

/**
 * Savings Withdrawal Approval Request Job
 */
export interface SavingsWithdrawalApprovalRequestJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_APPROVAL_REQUEST;
    data: {
        approverName: string;
        applicantName: string;
        withdrawalNumber: string;
        withdrawalAmount: number;
        roleName: string;
    };
}

/**
 * Savings Withdrawal Rejected Job
 */
export interface SavingsWithdrawalRejectedJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_REJECTED;
    data: {
        applicantName: string;
        withdrawalNumber: string;
        reason: string;
    };
}

/**
 * Savings Withdrawal Disbursement Request Job
 */
export interface SavingsWithdrawalDisbursementRequestJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_DISBURSEMENT_REQUEST;
    data: {
        shopkeeperName: string;
        applicantName: string;
        withdrawalNumber: string;
        withdrawalAmount: number;
        bankAccountNumber: string;
    };
}

/**
 * Savings Withdrawal Authorization Request Job
 */
export interface SavingsWithdrawalAuthorizationRequestJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_AUTHORIZATION_REQUEST;
    data: {
        ketuaName: string;
        applicantName: string;
        withdrawalNumber: string;
        withdrawalAmount: number;
    };
}

/**
 * Savings Withdrawal Approved Job
 */
export interface SavingsWithdrawalApprovedJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_APPROVED;
    data: {
        applicantName: string;
        withdrawalNumber: string;
        withdrawalAmount: number;
        bankAccountNumber: string;
    };
}

/**
 * Savings Withdrawal Completed Job
 */
export interface SavingsWithdrawalCompletedJob extends BaseEmailJob {
    type: EmailJobType.SAVINGS_WITHDRAWAL_COMPLETED;
    data: {
        applicantName: string;
        withdrawalNumber: string;
        withdrawalAmount: number;
    };
}

/**
 * Generic Email Job (untuk custom email)
 */
export interface GenericEmailJob extends BaseEmailJob {
    type: EmailJobType.GENERIC_EMAIL;
    data: {
        subject: string;
        html: string;
    };
}

/**
 * Union type untuk semua email job
 */
export type EmailJob =
    | EmailVerificationJob
    | PasswordResetJob
    | ApprovalRequestJob
    | ApplicationRejectedJob
    | MembershipApprovedJob
    | NewMemberNotificationJob
    | LoanApprovalRequestJob
    | LoanRevisedJob
    | LoanRejectedJob
    | LoanDisbursementRequestJob
    | LoanAuthorizationRequestJob
    | LoanDisbursedJob
    | LoanCompletionNotificationJob
    | DepositApprovalRequestJob
    | DepositRejectedJob
    | DepositApprovedJob
    | DepositPayrollNotificationJob
    | DepositChangeApprovalRequestJob
    | DepositChangeRejectedJob
    | DepositChangeApprovedJob
    | DepositChangePayrollNotificationJob
    | DepositChangeEmployeeNotificationJob
    | SavingsWithdrawalApprovalRequestJob
    | SavingsWithdrawalRejectedJob
    | SavingsWithdrawalDisbursementRequestJob
    | SavingsWithdrawalAuthorizationRequestJob
    | SavingsWithdrawalApprovedJob
    | SavingsWithdrawalCompletedJob
    | GenericEmailJob;

/**
 * Constants untuk queue name
 */
export const EMAIL_QUEUE_NAME = 'email-queue';

/**
 * Default job options
 */
export const DEFAULT_EMAIL_JOB_OPTIONS = {
    attempts: 5, // Retry 5 kali jika gagal
    backoff: {
        type: 'exponential' as const,
        delay: 2000, // Start dengan 2 detik, lalu 4, 8, 16, 32 detik
    },
    removeOnComplete: {
        age: 24 * 3600, // Hapus job yang sukses setelah 24 jam
        count: 1000, // Simpan maksimal 1000 job sukses
    },
    removeOnFail: {
        age: 7 * 24 * 3600, // Simpan job gagal selama 7 hari untuk debugging
    },
};

/**
 * Batch email options untuk bulk sending
 */
export interface BulkEmailOptions {
    /** Delay antar email dalam ms (untuk rate limiting) */
    delayBetweenEmails?: number;
    /** Priority (higher = more priority) */
    priority?: number;
}
