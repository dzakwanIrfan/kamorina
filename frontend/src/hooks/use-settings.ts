'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/setting.service';
import { SettingCategory } from '@/types/setting.types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSettingsByCategory(category: SettingCategory) {
  return useQuery({
    queryKey: ['settings', category],
    queryFn: () => settingsService.getByCategory(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => settingsService.getByKey(key),
    staleTime: 5 * 60 * 1000,
  });
}

// Helper to get parsed value
export function getSettingValue(data: any): any {
  if (!data) return null;
  
  switch (data.type) {
    case 'NUMBER':
      return parseFloat(data.value);
    case 'BOOLEAN':
      return data.value === 'true';
    case 'JSON':
      try {
        return JSON.parse(data.value);
      } catch {
        return null;
      }
    default:
      return data.value;
  }
}