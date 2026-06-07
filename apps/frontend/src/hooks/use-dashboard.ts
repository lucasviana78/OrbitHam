'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import type { Dashboard } from '@/types';

export function useDashboard(stationId?: number, days?: number) {
  return useQuery<Dashboard>({
    queryKey: ['dashboard', stationId ?? null, days ?? null],
    queryFn: () => dashboardService.get(stationId, days),
  });
}
