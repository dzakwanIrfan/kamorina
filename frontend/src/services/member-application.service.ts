import { apiClient } from '@/lib/axios';
import {
  MemberApplication,
  SubmitApplicationRequest,
  ApproveRejectRequest,
} from '@/types/member-application.types';

export const memberApplicationService = {
  async submitApplication(data: SubmitApplicationRequest): Promise<{ message: string; applicationId: string }> {
    const response = await apiClient.post('/member-applications/submit', data);
    return response.data;
  },

  async getMyApplication(): Promise<MemberApplication> {
    const response = await apiClient.get('/member-applications/my-application');
    return response.data;
  },

  async processApproval(
    applicationId: string,
    data: ApproveRejectRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(`/member-applications/${applicationId}/process`, data);
    return response.data;
  },
};