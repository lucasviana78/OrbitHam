'use client';

import { useQuery } from '@tanstack/react-query';
import { passesService, type PassQuery } from '@/services/passes';
import type { Pass } from '@/types';

/**
 * Queries satellite passes. Disabled until both satellite and station are set.
 */
export function usePasses(query: Partial<PassQuery>) {
  const enabled =
    query.satellite_id != null && query.station_id != null;
  return useQuery<Pass[]>({
    queryKey: ['passes', query.satellite_id, query.station_id, query.days],
    queryFn: () =>
      passesService.list({
        satellite_id: query.satellite_id as number,
        station_id: query.station_id as number,
        days: query.days ?? 3,
      }),
    enabled,
  });
}
