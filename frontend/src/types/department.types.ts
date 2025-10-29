export interface Department {
  id: string;
  departmentName: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
  users?: User[];
}

export interface CreateDepartmentRequest {
  departmentName: string;
}

export interface UpdateDepartmentRequest {
  departmentName: string;
}

export interface QueryDepartmentParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  departmentName?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  nik?: string;
}