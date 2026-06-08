'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { satellitesService } from '@/services/satellites';
import type { Satellite } from '@/types';

export function useSatellites(search?: string, category?: string) {
  return useQuery<Satellite[]>({
    queryKey: ['satellites', search ?? '', category ?? ''],
    queryFn: () => satellitesService.list(search, category),
  });
}

export function useSetSatelliteFrequency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      downlinkMhz,
    }: {
      id: number;
      downlinkMhz: number | null;
    }) => satellitesService.setFrequency(id, downlinkMhz),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['satellites'] }),
  });
}
