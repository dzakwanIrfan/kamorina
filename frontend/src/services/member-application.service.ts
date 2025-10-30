import { apiClient } from '@/lib/axios';
import {
  MemberApplication,
  SubmitApplicationRequest,
  ApproveRejectRequest,
  BulkApproveRejectRequest,
  QueryApplicationParams,
} from '@/types/member-application.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const memberApplicationService = {
  async submitApplication(data: SubmitApplicationRequest): Promise<{ message: string; applicationId: string }> {
    const response = await apiClient.post('/member-applications/submit', data);
    return response.data;
  },

  async getMyApplication(): Promise<MemberApplication> {
    const response = await apiClient.get('/member-applications/my-application');
    return response.data;
  },

  async getApplications(params?: QueryApplicationParams): Promise<PaginatedResponse<MemberApplication>> {
    const response = await apiClient.get('/member-applications', { params });
    return response.data;
  },

  async getApplicationById(id: string): Promise<MemberApplication> {
    const response = await apiClient.get(`/member-applications/${id}`);
    return response.data;
  },

  async processApproval(
    applicationId: string,
    data: ApproveRejectRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(`/member-applications/${applicationId}/process`, data);
    return response.data;
  },

  async bulkProcessApproval(
    data: BulkApproveRejectRequest
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/member-applications/bulk-process', data);
    return response.data;
  },
};