import { apiClient } from '@/lib/axios';
import {
  Golongan,
  CreateGolonganRequest,
  UpdateGolonganRequest,
  QueryGolonganParams,
} from '@/types/golongan.types';
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

  async create(data: CreateGolonganRequest): Promise<Golongan> {
    const response = await apiClient.post('/golongan', data);
    return response.data;
  },

  async update(id: string, data: UpdateGolonganRequest): Promise<Golongan> {
    const response = await apiClient.patch(`/golongan/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/golongan/${id}`);
    return response.data;
  },
};