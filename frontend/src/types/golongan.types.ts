export interface Golongan {
  id: string;
  golonganName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
    loanLimits: number;
  };
  employees?: Employee[];
  loanLimits?: LoanLimitMatrix[];
}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: 'TETAP' | 'KONTRAK';
  isActive: boolean;
}

export interface LoanLimitMatrix {
  id: string;
  golonganId: string;
  minYearsOfService: number;
  maxYearsOfService: number | null;
  maxLoanAmount: number;
  createdAt: string;
  updatedAt: string;
  golongan?: {
    id: string;
    golonganName: string;
  };
}

export interface CreateGolonganRequest {
  golonganName: string;
  description?: string;
}

export interface UpdateGolonganRequest {
  golonganName?: string;
  description?: string;
}

export interface QueryGolonganParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  golonganName?: string;
}

export interface BulkDeleteGolonganRequest {
  ids: string[];
}

export interface ExportGolonganParams {
  format: 'csv' | 'excel' | 'pdf';
  search?: string;
  golonganName?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateLoanLimitRequest {
  golonganId: string;
  minYearsOfService: number;
  maxYearsOfService?: number | null;
  maxLoanAmount: number;
}

export interface UpdateLoanLimitRequest {
  minYearsOfService?: number;
  maxYearsOfService?: number | null;
  maxLoanAmount?: number;
}

export interface BulkUpdateLoanLimitsRequest {
  golonganId: string;
  limits: {
    minYearsOfService: string;
    maxYearsOfService: string;
    maxLoanAmount: string;
  }[];
}