import { apiClient } from "@/lib/axios";
import {
  LoanRepayment,
  RepaymentCalculation,
  CreateRepaymentDto,
  ApproveRepaymentDto,
  BulkApproveRepaymentDto,
  QueryRepaymentParams,
} from "@/types/loan-repayment.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const loanRepaymentService = {
  // Member endpoints
  async getRepaymentCalculation(
    loanApplicationId: string
  ): Promise<RepaymentCalculation> {
    const response = await apiClient.get(
      `/loan-repayments/calculate/${loanApplicationId}`
    );
    return response.data;
  },

  async createRepayment(
    data: CreateRepaymentDto
  ): Promise<{
    message: string;
    repayment: LoanRepayment;
    calculation: RepaymentCalculation;
  }> {
    const response = await apiClient.post("/loan-repayments", data);
    return response.data;
  },

  async getMyRepayments(
    params?: QueryRepaymentParams
  ): Promise<PaginatedResponse<LoanRepayment>> {
    const response = await apiClient.get("/loan-repayments/my-repayments", {
      params,
    });
    return response.data;
  },

  async getMyRepaymentById(
    id: string
  ): Promise<LoanRepayment & { calculation: RepaymentCalculation }> {
    const response = await apiClient.get(
      `/loan-repayments/my-repayments/${id}`
    );
    return response.data;
  },

  // Approver endpoints
  async getAllRepayments(
    params?: QueryRepaymentParams
  ): Promise<PaginatedResponse<LoanRepayment>> {
    const response = await apiClient.get("/loan-repayments", { params });
    return response.data;
  },

  async getRepaymentById(
    id: string
  ): Promise<LoanRepayment & { calculation: RepaymentCalculation }> {
    const response = await apiClient.get(`/loan-repayments/${id}`);
    return response.data;
  },

  async processApproval(
    id: string,
    data: ApproveRepaymentDto
  ): Promise<{
    message: string;
    newStatus: string;
    nextStep?: string;
  }> {
    const response = await apiClient.post(
      `/loan-repayments/${id}/approve`,
      data
    );
    return response.data;
  },

  async bulkProcessApproval(
    data: BulkApproveRepaymentDto
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post(
      "/loan-repayments/bulk-approve",
      data
    );
    return response.data;
  },
};
