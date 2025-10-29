import { apiClient } from '@/lib/axios';
import {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  QueryDepartmentParams,
} from '@/types/department.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const departmentService = {
  async getAll(params?: QueryDepartmentParams): Promise<PaginatedResponse<Department>> {
    const response = await apiClient.get('/departments', { params });
    return response.data;
  },

  async getById(id: string): Promise<Department> {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  async create(data: CreateDepartmentRequest): Promise<Department> {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  async update(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },
};