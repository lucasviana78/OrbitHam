import { apiFetchValidated } from './api';
import { satelliteListSchema, type Satellite } from '@/types';

export const satellitesService = {
  list: (search?: string, category?: string): Promise<Satellite[]> =>
    apiFetchValidated('/satellites', satelliteListSchema, {
      query: { search, category },
    }),
};
