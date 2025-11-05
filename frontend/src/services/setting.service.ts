import { apiClient } from '@/lib/axios';
import { GroupedSettings, CooperativeSetting, SettingCategory } from '@/types/setting.types';

export const settingsService = {
  getAll: async (): Promise<GroupedSettings> => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  getByCategory: async (category: SettingCategory): Promise<CooperativeSetting[]> => {
    const response = await apiClient.get(`/settings/category/${category}`);
    return response.data;
  },

  getByKey: async (key: string): Promise<CooperativeSetting> => {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  },

  update: async (key: string, value: string): Promise<CooperativeSetting> => {
    const response = await apiClient.put(`/settings/${key}`, { value });
    return response.data;
  },

  bulkUpdate: async (
    settings: Array<{ key: string; value: string }>
  ): Promise<any> => {
    const response = await apiClient.put('/settings', { settings });
    return response.data;
  },
};