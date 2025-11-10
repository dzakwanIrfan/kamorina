export interface Golongan {
  id: string;
  golonganName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
  };
  employees?: Employee[];
}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: 'TETAP' | 'KONTRAK';
  isActive: boolean;
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