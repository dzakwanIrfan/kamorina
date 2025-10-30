export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
  users?: Array<{
    id: string;
    name: string;
    email: string;
    memberVerified: boolean;
  }>;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  fullName: string;
  isActive?: boolean;
}

export interface UpdateEmployeeRequest {
  employeeNumber?: string;
  fullName?: string;
  isActive?: boolean;
}

export interface QueryEmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  employeeNumber?: string;
  fullName?: string;
  startDate?: string;
  endDate?: string;
}