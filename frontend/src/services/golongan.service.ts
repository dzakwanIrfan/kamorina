import { apiClient } from '@/lib/axios';
import {
  Golongan,
  CreateGolonganRequest,
  UpdateGolonganRequest,
  QueryGolonganParams,
  LoanLimitMatrix,
  CreateLoanLimitRequest,
  UpdateLoanLimitRequest,
  BulkUpdateLoanLimitsRequest,
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

  // Loan Limits
  async getLoanLimitsByGolongan(golonganId: string): Promise<LoanLimitMatrix[]> {
    const response = await apiClient.get(`/golongan/${golonganId}/loan-limits`);
    return response.data;
  },

  async createLoanLimit(data: CreateLoanLimitRequest): Promise<LoanLimitMatrix> {
    const response = await apiClient.post('/golongan/loan-limits', data);
    return response.data;
  },

  async bulkUpdateLoanLimits(
    data: BulkUpdateLoanLimitsRequest
  ): Promise<{ message: string; count: number }> {
    const response = await apiClient.post('/golongan/loan-limits/bulk', data);
    return response.data;
  },

  async updateLoanLimit(
    id: string,
    data: UpdateLoanLimitRequest
  ): Promise<LoanLimitMatrix> {
    const response = await apiClient.patch(`/golongan/loan-limits/${id}`, data);
    return response.data;
  },

  async deleteLoanLimit(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/golongan/loan-limits/${id}`);
    return response.data;
  },

  async getMaxLoanAmountForUser(userId: string): Promise<number> {
    const response = await apiClient.get(`/golongan/users/${userId}/max-loan-amount`);
    return response.data;
  },
};