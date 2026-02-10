import { apiClient } from "@/lib/axios";
import {
  PayrollPeriod,
  PayrollTransaction,
  PayrollProcessResult,
  PayrollPreview,
  QueryPayrollParams,
  QueryPayrollTransactionsParams,
  ManualPayrollDto,
  BulkDeletePayrollDto,
} from "@/types/payroll.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const payrollService = {
  async getAllPeriods(
    params?: QueryPayrollParams,
  ): Promise<PaginatedResponse<PayrollPeriod>> {
    const response = await apiClient.get("/payroll/periods", { params });
    return response.data;
  },

  async getPeriodDetail(
    periodId: string,
  ): Promise<{ success: boolean; data: PayrollPeriod }> {
    const response = await apiClient.get(`/payroll/periods/${periodId}`);
    return response.data;
  },

  async getPeriodTransactions(
    periodId: string,
    params?: QueryPayrollTransactionsParams,
  ): Promise<PaginatedResponse<PayrollTransaction>> {
    const response = await apiClient.get(
      `/payroll/periods/${periodId}/transactions`,
      { params },
    );
    return response.data;
  },

  async triggerPayroll(
    data: ManualPayrollDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: PayrollProcessResult;
  }> {
    const response = await apiClient.post("/payroll/process", data);
    return response.data;
  },

  async deletePeriod(periodId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/payroll/periods/${periodId}`);
    return response.data;
  },

  async bulkDeletePeriods(
    data: BulkDeletePayrollDto,
  ): Promise<{ message: string; results: any }> {
    const response = await apiClient.post("/payroll/periods/bulk-delete", data);
    return response.data;
  },

  async getPayrollStatus(params?: {
    month?: number;
    year?: number;
  }): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get("/payroll/status", { params });
    return response.data;
  },

  async getPayrollPreview(params?: {
    month?: number;
    year?: number;
  }): Promise<{ success: boolean; data: PayrollPreview }> {
    const response = await apiClient.get("/payroll/preview", { params });
    return response.data;
  },
};
