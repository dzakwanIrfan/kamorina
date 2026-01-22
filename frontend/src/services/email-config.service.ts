import { apiClient } from "@/lib/axios";
import {
  CreateEmailConfigFn,
  EmailConfig,
  UpdateEmailConfigFn,
} from "@/types/email-config.types";

export const emailConfigService = {
  getAll: async () => {
    const response = await apiClient.get<EmailConfig[]>("/email-configs");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<EmailConfig>(`/email-configs/${id}`);
    return response.data;
  },

  create: async (data: CreateEmailConfigFn) => {
    const response = await apiClient.post<EmailConfig>("/email-configs", data);
    return response.data;
  },

  update: async (id: string, data: UpdateEmailConfigFn) => {
    const response = await apiClient.patch<EmailConfig>(
      `/email-configs/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/email-configs/${id}`);
    return response.data;
  },
};
