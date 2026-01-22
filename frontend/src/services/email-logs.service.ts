import { apiClient } from "@/lib/axios";
import {
  EmailLog,
  EmailLogQuery,
  EmailLogResponse,
} from "@/types/email-logs.types";

export const emailLogsService = {
  getAll: async (params: EmailLogQuery) => {
    const response = await apiClient.get<EmailLogResponse>("/email-logs", {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<EmailLog>(`/email-logs/${id}`);
    return response.data;
  },

  resend: async (id: string) => {
    const response = await apiClient.post(`/email-logs/${id}/resend`);
    return response.data;
  },
};
