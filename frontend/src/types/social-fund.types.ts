export enum SocialFundTransactionType {
  INITIAL_BALANCE = 'INITIAL_BALANCE',
  ADJUSTMENT = 'ADJUSTMENT',
  SANTUNAN = 'SANTUNAN',
}

export interface SocialFundTransaction {
  id: string;
  type: SocialFundTransactionType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  recipientUserId: string | null;
  recipientUser?: {
    id: string;
    name: string;
    nik: string | null;
    employee: {
      employeeNumber: string;
      fullName: string;
      department: { departmentName: string };
    };
  } | null;
  createdBy: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface SocialFundBalance {
  currentBalance: number;
}

export interface EligibleMember {
  id: string;
  name: string;
  nik: string | null;
  employee: {
    employeeNumber: string;
    fullName: string;
    department: { departmentName: string };
  };
}

export interface CreateInitialBalanceDto {
  amount: number;
  description?: string;
}

export interface UpdateInitialBalanceDto {
  amount?: number;
  description?: string;
}

export interface CreateSantunanDto {
  recipientUserId: string;
  amount: number;
  description: string;
}

export interface QuerySocialFundParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  type?: SocialFundTransactionType;
}
