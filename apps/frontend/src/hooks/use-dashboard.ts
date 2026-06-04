'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import type { Dashboard } from '@/types';

export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.get(),
  });
}
