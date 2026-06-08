import { apiFetchValidated } from './api';
import { satelliteListSchema, satelliteSchema, type Satellite } from '@/types';

export const satellitesService = {
  list: (search?: string, category?: string): Promise<Satellite[]> =>
    apiFetchValidated('/satellites', satelliteListSchema, {
      query: { search, category },
    }),

  setFrequency: (id: number, downlinkMhz: number | null): Promise<Satellite> =>
    apiFetchValidated(`/satellites/${id}/frequency`, satelliteSchema, {
      method: 'PATCH',
      body: { downlink_mhz: downlinkMhz },
    }),
};
