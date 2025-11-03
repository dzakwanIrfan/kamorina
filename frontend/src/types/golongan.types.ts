export interface Golongan {
  id: string;
  golonganName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryGolonganParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}