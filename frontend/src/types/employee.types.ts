export enum EmployeeType {
  TETAP = 'TETAP',
  KONTRAK = 'KONTRAK',
}

export interface Department {
  id: string;
  departmentName: string;
}

export interface Golongan {
  id: string;
  golonganName: string;
  description?: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  departmentId: string;
  department?: Department;
  golonganId: string;
  golongan?: Golongan;
  employeeType: EmployeeType;
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
  permanentEmployeeDate?: Date;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  fullName: string;
  departmentId: string;
  golonganId: string;
  employeeType: EmployeeType;
  permanentEmployeeDate?: Date;
}

export interface UpdateEmployeeRequest {
  employeeNumber?: string;
  fullName?: string;
  departmentId?: string;
  golonganId?: string;
  employeeType?: EmployeeType;
  isActive?: boolean;
  permanentEmployeeDate?: Date;
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
  departmentId?: string;
  golonganId?: string;
  employeeType?: EmployeeType;
  startDate?: string;
  endDate?: string;
}