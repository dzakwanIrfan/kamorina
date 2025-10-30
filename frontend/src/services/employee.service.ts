import { apiClient } from '@/lib/axios';
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  QueryEmployeeParams,
} from '@/types/employee.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const employeeService = {
  async getAll(params?: QueryEmployeeParams): Promise<PaginatedResponse<Employee>> {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  async getById(id: string): Promise<Employee> {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async create(data: CreateEmployeeRequest): Promise<{ message: string; data: Employee }> {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployeeRequest): Promise<{ message: string; data: Employee }> {
    const response = await apiClient.patch(`/employees/${id}`, data);
    return response.data;
  },

  async toggleActive(id: string): Promise<{ message: string; data: Employee }> {
    const response = await apiClient.patch(`/employees/${id}/toggle-active`);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },
};