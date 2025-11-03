import { apiClient } from '@/lib/axios';
import { Golongan, QueryGolonganParams } from '@/types/golongan.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const golonganService = {
  async getAll(params?: QueryGolonganParams): Promise<PaginatedResponse<Golongan>> {
    const response = await apiClient.get('/golongan', { params });
    return response.data;
  },

  async getById(id: string): Promise<Golongan> {
    const response = await apiClient.get(`/golongan/${id}`);
    return response.data;
  },
};