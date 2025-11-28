'use client';

import { useQuery } from '@tanstack/react-query';
import { depositOptionService } from '@/services/deposit-option.service';

export function useDepositConfig() {
  return useQuery({
    queryKey: ['deposit-config'],
    queryFn: () => depositOptionService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}