import { apiClient } from '@/lib/axios';
import {
  LoanApplication,
  CreateLoanDto,
  UpdateLoanDto,
  ReviseLoanDto,
  ApproveLoanDto,
  BulkApproveLoanDto,
  ProcessDisbursementDto,
  BulkProcessDisbursementDto,
  ProcessAuthorizationDto,
  BulkProcessAuthorizationDto,
  QueryLoanParams,
} from '@/types/loan.types';
import { PaginatedResponse } from '@/types/pagination.types';

export const loanService = {
  // Member endpoints
  async createDraft(data: CreateLoanDto): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.post('/loans/draft', data);
    return response.data;
  },

  async updateDraft(
    loanId: string,
    data: UpdateLoanDto
  ): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.put(`/loans/draft/${loanId}`, data);
    return response.data;
  },

  async submitLoan(loanId: string): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.post(`/loans/${loanId}/submit`);
    return response.data;
  },

  async deleteDraft(loanId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/loans/draft/${loanId}`);
    return response.data;
  },

  async getMyLoans(params?: QueryLoanParams): Promise<PaginatedResponse<LoanApplication>> {
    const response = await apiClient.get('/loans/my-loans', { params });
    return response.data;
  },

  async getMyLoanById(loanId: string): Promise<LoanApplication> {
    const response = await apiClient.get(`/loans/my-loans/${loanId}`);
    return response.data;
  },

  async uploadAttachments(files: File[]): Promise<{ message: string; files: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await apiClient.post('/loans/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Approver endpoints
  async getAllLoans(params?: QueryLoanParams): Promise<PaginatedResponse<LoanApplication>> {
    const response = await apiClient.get('/loans', { params });
    return response.data;
  },

  async getLoanById(loanId: string): Promise<LoanApplication> {
    const response = await apiClient.get(`/loans/${loanId}`);
    return response.data;
  },

  async reviseLoan(
    loanId: string,
    data: ReviseLoanDto
  ): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.put(`/loans/${loanId}/revise`, data);
    return response.data;
  },

  async processApproval(
    loanId: string,
    data: ApproveLoanDto
  ): Promise<{ message: string }> {
    const response = await apiClient.post(`/loans/${loanId}/approve`, data);
    return response.data;
  },

  async bulkProcessApproval(
    data: BulkApproveLoanDto
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/loans/bulk-approve', data);
    return response.data;
  },

  // Shopkeeper endpoints
  async getPendingDisbursement(
    params?: QueryLoanParams
  ): Promise<PaginatedResponse<LoanApplication>> {
    const response = await apiClient.get('/loans/disbursement/pending', { params });
    return response.data;
  },

  async processDisbursement(
    loanId: string,
    data: ProcessDisbursementDto
  ): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.post(`/loans/${loanId}/disbursement`, data);
    return response.data;
  },

  async bulkProcessDisbursement(
    data: BulkProcessDisbursementDto
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/loans/disbursement/bulk', data);
    return response.data;
  },

  // Ketua authorization endpoints
  async getPendingAuthorization(
    params?: QueryLoanParams
  ): Promise<PaginatedResponse<LoanApplication>> {
    const response = await apiClient.get('/loans/authorization/pending', { params });
    return response.data;
  },

  async processAuthorization(
    loanId: string,
    data: ProcessAuthorizationDto
  ): Promise<{ message: string; loan: LoanApplication }> {
    const response = await apiClient.post(`/loans/${loanId}/authorization`, data);
    return response.data;
  },

  async bulkProcessAuthorization(
    data: BulkProcessAuthorizationDto
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post('/loans/authorization/bulk', data);
    return response.data;
  },
};