import { apiClient } from "@/lib/axios";
import {
  SalaryDeductionReport,
  QuerySalaryDeductionReportParams,
} from "@/types/salary-deduction-report.types";

export const salaryDeductionReportService = {
  async getReport(
    params?: QuerySalaryDeductionReportParams,
  ): Promise<{ success: boolean; data: SalaryDeductionReport }> {
    const response = await apiClient.get("/salary-deduction-report", {
      params,
    });
    return response.data;
  },

  async exportExcel(params?: QuerySalaryDeductionReportParams): Promise<void> {
    const response = await apiClient.get("/salary-deduction-report/export", {
      params,
      responseType: "blob",
      timeout: 30000,
    });

    const month = params?.month || new Date().getMonth() + 1;
    const year = params?.year || new Date().getFullYear();
    const filename = `Pemotongan_Gaji_${year}_${String(month).padStart(2, "0")}.xlsx`;

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
