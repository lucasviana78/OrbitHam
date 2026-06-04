'use client';

import { useQuery } from '@tanstack/react-query';
import { satellitesService } from '@/services/satellites';
import type { Satellite } from '@/types';

export function useSatellites(search?: string, category?: string) {
  return useQuery<Satellite[]>({
    queryKey: ['satellites', search ?? '', category ?? ''],
    queryFn: () => satellitesService.list(search, category),
  });
}
