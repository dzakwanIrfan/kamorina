import { apiClient } from "@/lib/axios";
import {
  LoanBalanceReport,
  QueryLoanBalanceReportParams,
} from "@/types/loan-balance-report.types";

export const loanBalanceReportService = {
  async getReport(
    params?: QueryLoanBalanceReportParams,
  ): Promise<{ success: boolean; data: LoanBalanceReport }> {
    const response = await apiClient.get("/loan-balance-report", { params });
    return response.data;
  },

  async exportExcel(params?: QueryLoanBalanceReportParams): Promise<void> {
    const response = await apiClient.get("/loan-balance-report/export", {
      params,
      responseType: "blob",
      timeout: 30000,
    });

    const year = params?.year || new Date().getFullYear();
    const filename = `Total_Saldo_Freeze_Pinjaman_${year}.xlsx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
