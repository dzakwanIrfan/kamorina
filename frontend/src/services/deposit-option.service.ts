import { apiClient } from '@/lib/axios';
import {
  DepositAmountOption,
  DepositTenorOption,
  DepositConfig,
  DepositCalculation,
  CreateDepositAmountDto,
  UpdateDepositAmountDto,
  CreateDepositTenorDto,
  UpdateDepositTenorDto,
  QueryDepositOptionParams,
} from '@/types/deposit-option.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const depositOptionService = {
  // Config endpoint (for deposit form)
  async getConfig(): Promise<DepositConfig> {
    const response = await apiClient.get('/deposit-options/config');
    return response.data;
  },

  // Preview calculation
  async previewCalculation(amountCode: string, tenorCode: string): Promise<DepositCalculation> {
    const response = await apiClient.get('/deposit-options/preview-calculation', {
      params: { amountCode, tenorCode },
    });
    return response.data;
  },

  // Amount options
  async getAllAmounts(params?: QueryDepositOptionParams): Promise<PaginatedResponse<DepositAmountOption>> {
    const response = await apiClient.get('/deposit-options/amounts', { params });
    return response.data;
  },

  async getAmountById(id: string): Promise<DepositAmountOption> {
    const response = await apiClient.get(`/deposit-options/amounts/${id}`);
    return response.data;
  },

  async createAmount(data: CreateDepositAmountDto): Promise<DepositAmountOption> {
    const response = await apiClient.post('/deposit-options/amounts', data);
    return response.data;
  },

  async updateAmount(id: string, data: UpdateDepositAmountDto): Promise<DepositAmountOption> {
    const response = await apiClient.put(`/deposit-options/amounts/${id}`, data);
    return response.data;
  },

  async deleteAmount(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/deposit-options/amounts/${id}`);
    return response.data;
  },

  // Tenor options
  async getAllTenors(params?: QueryDepositOptionParams): Promise<PaginatedResponse<DepositTenorOption>> {
    const response = await apiClient.get('/deposit-options/tenors', { params });
    return response.data;
  },

  async getTenorById(id: string): Promise<DepositTenorOption> {
    const response = await apiClient.get(`/deposit-options/tenors/${id}`);
    return response.data;
  },

  async createTenor(data: CreateDepositTenorDto): Promise<DepositTenorOption> {
    const response = await apiClient.post('/deposit-options/tenors', data);
    return response.data;
  },

  async updateTenor(id: string, data: UpdateDepositTenorDto): Promise<DepositTenorOption> {
    const response = await apiClient.put(`/deposit-options/tenors/${id}`, data);
    return response.data;
  },

  async deleteTenor(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/deposit-options/tenors/${id}`);
    return response.data;
  },
};