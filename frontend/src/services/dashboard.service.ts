import { apiClient } from '@/lib/axios';
import { DashboardSummary } from '@/types/dashboard.types';

export const dashboardService = {
  /**
   * Get dashboard summary for the authenticated user
   * Returns personalized data based on user's role
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },
};
