import { apiClient } from '@/lib/axios';
import {
  DepositChangeRequest,
  CreateDepositChangeDto,
  UpdateDepositChangeDto,
  ApproveDepositChangeDto,
  BulkApproveDepositChangeDto,
  QueryDepositChangeParams,
  DepositChangePreview,
} from '@/types/deposit-change.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const depositChangeService = {
  // Preview calculation
  async previewChange(
    depositId: string,
    newAmountCode: string,
    newTenorCode: string
  ): Promise<DepositChangePreview> {
    const response = await apiClient.get('/deposit-changes/preview', {
      params: { depositId, newAmountCode, newTenorCode },
    });
    return response.data;
  },

  // Create draft
  async createDraft(
    data: CreateDepositChangeDto
  ): Promise<{ message: string; changeRequest: DepositChangeRequest; comparison: any }> {
    const response = await apiClient.post('/deposit-changes/draft', data);
    return response.data;
  },

  // Update draft
  async updateDraft(
    changeId: string,
    data: UpdateDepositChangeDto
  ): Promise<{ message: string; changeRequest: DepositChangeRequest }> {
    const response = await apiClient.put(`/deposit-changes/draft/${changeId}`, data);
    return response.data;
  },

  // Submit change request
  async submitChangeRequest(
    changeId: string
  ): Promise<{ message: string; changeRequest: DepositChangeRequest }> {
    const response = await apiClient.post(`/deposit-changes/${changeId}/submit`);
    return response.data;
  },

  // Cancel draft
  async cancelDraft(changeId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/deposit-changes/draft/${changeId}`);
    return response. data;
  },

  // Get my change requests
  async getMyChangeRequests(
    params?: QueryDepositChangeParams
  ): Promise<PaginatedResponse<DepositChangeRequest>> {
    const response = await apiClient. get('/deposit-changes/my-requests', { params });
    return response.data;
  },

  // Get my change request by ID
  async getMyChangeRequestById(changeId: string): Promise<DepositChangeRequest> {
    const response = await apiClient.get(`/deposit-changes/my-requests/${changeId}`);
    return response.data;
  },

  // APPROVER ENDPOINTS

  // Get all change requests
  async getAllChangeRequests(
    params?: QueryDepositChangeParams
  ): Promise<PaginatedResponse<DepositChangeRequest>> {
    const response = await apiClient.get('/deposit-changes', { params });
    return response.data;
  },

  // Get change request by ID
  async getChangeRequestById(changeId: string): Promise<DepositChangeRequest> {
    const response = await apiClient.get(`/deposit-changes/${changeId}`);
    return response.data;
  },

  // Process approval
  async processApproval(
    changeId: string,
    data: ApproveDepositChangeDto
  ): Promise<{ message: string }> {
    const response = await apiClient.post(`/deposit-changes/${changeId}/approve`, data);
    return response.data;
  },

  // Bulk approve/reject
  async bulkProcessApproval(
    data: BulkApproveDepositChangeDto
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/deposit-changes/bulk-approve', data);
    return response.data;
  },
};