import { apiClient } from '@/lib/axios';
import {
  SocialFundTransaction,
  SocialFundBalance,
  EligibleMember,
  CreateInitialBalanceDto,
  UpdateInitialBalanceDto,
  CreateSantunanDto,
  QuerySocialFundParams,
} from '@/types/social-fund.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const socialFundService = {
  // Balance
  async getBalance(): Promise<SocialFundBalance> {
    const response = await apiClient.get('/social-fund/balance');
    return response.data;
  },

  // Initial Balance CRUD
  async getInitialBalances(
    params?: QuerySocialFundParams,
  ): Promise<PaginatedResponse<SocialFundTransaction>> {
    const response = await apiClient.get('/social-fund/initial-balance', { params });
    return response.data;
  },

  async createInitialBalance(
    data: CreateInitialBalanceDto,
  ): Promise<{ message: string; data: SocialFundTransaction }> {
    const response = await apiClient.post('/social-fund/initial-balance', data);
    return response.data;
  },

  async updateInitialBalance(
    id: string,
    data: UpdateInitialBalanceDto,
  ): Promise<{ message: string; data: SocialFundTransaction }> {
    const response = await apiClient.put(`/social-fund/initial-balance/${id}`, data);
    return response.data;
  },

  async deleteInitialBalance(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/social-fund/initial-balance/${id}`);
    return response.data;
  },

  // Santunan
  async getSantunanList(
    params?: QuerySocialFundParams,
  ): Promise<PaginatedResponse<SocialFundTransaction>> {
    const response = await apiClient.get('/social-fund/santunan', { params });
    return response.data;
  },

  async createSantunan(
    data: CreateSantunanDto,
  ): Promise<{ message: string; data: SocialFundTransaction }> {
    const response = await apiClient.post('/social-fund/santunan', data);
    return response.data;
  },

  async deleteSantunan(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/social-fund/santunan/${id}`);
    return response.data;
  },

  // Eligible Members
  async getEligibleMembers(search?: string): Promise<EligibleMember[]> {
    const response = await apiClient.get('/social-fund/eligible-members', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  // All Transactions (Ledger)
  async getTransactions(
    params?: QuerySocialFundParams,
  ): Promise<PaginatedResponse<SocialFundTransaction>> {
    const response = await apiClient.get('/social-fund/transactions', { params });
    return response.data;
  },
};
