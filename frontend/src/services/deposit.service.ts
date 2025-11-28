import { apiClient } from '@/lib/axios';
import {
  DepositApplication,
  CreateDepositDto,
  UpdateDepositDto,
  ApproveDepositDto,
  BulkApproveDepositDto,
  QueryDepositParams,
} from '@/types/deposit.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const depositService = {
  // Member endpoints
  async createDraft(
    data: CreateDepositDto
  ): Promise<{ message: string; deposit: DepositApplication; calculation?: any }> {
    const response = await apiClient.post('/deposits/draft', data);
    return response.data;
  },

  async updateDraft(
    depositId: string,
    data: UpdateDepositDto
  ): Promise<{ message: string; deposit: DepositApplication }> {
    const response = await apiClient.put(`/deposits/draft/${depositId}`, data);
    return response.data;
  },

  async submitDeposit(depositId: string): Promise<{ message: string; deposit: DepositApplication }> {
    const response = await apiClient.post(`/deposits/${depositId}/submit`);
    return response.data;
  },

  async deleteDraft(depositId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/deposits/draft/${depositId}`);
    return response.data;
  },

  async getMyDeposits(params?: QueryDepositParams): Promise<PaginatedResponse<DepositApplication>> {
    const response = await apiClient.get('/deposits/my-deposits', { params });
    return response.data;
  },

  async getMyDepositById(depositId: string): Promise<DepositApplication & { calculationBreakdown?: any }> {
    const response = await apiClient.get(`/deposits/my-deposits/${depositId}`);
    return response.data;
  },

  // Approver endpoints
  async getAllDeposits(params?: QueryDepositParams): Promise<PaginatedResponse<DepositApplication>> {
    const response = await apiClient.get('/deposits', { params });
    return response.data;
  },

  async getDepositById(depositId: string): Promise<DepositApplication & { calculationBreakdown?: any }> {
    const response = await apiClient.get(`/deposits/${depositId}`);
    return response.data;
  },

  async processApproval(depositId: string, data: ApproveDepositDto): Promise<{ message: string }> {
    const response = await apiClient.post(`/deposits/${depositId}/approve`, data);
    return response.data;
  },

  async bulkProcessApproval(data: BulkApproveDepositDto): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/deposits/bulk-approve', data);
    return response.data;
  },
};