'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { stationsService } from '@/services/stations';
import type { Station, StationFormInput } from '@/types';

export const STATIONS_QUERY_KEY = ['stations'] as const;

export function useStations() {
  return useQuery<Station[]>({
    queryKey: STATIONS_QUERY_KEY,
    queryFn: () => stationsService.list(),
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StationFormInput) => stationsService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STATIONS_QUERY_KEY }),
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StationFormInput }) =>
      stationsService.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STATIONS_QUERY_KEY }),
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stationsService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: STATIONS_QUERY_KEY }),
  });
}
