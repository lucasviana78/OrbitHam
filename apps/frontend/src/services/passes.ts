import { apiFetchValidated } from './api';
import { passListSchema, type Pass } from '@/types';

export interface PassQuery {
  satellite_id: number;
  station_id: number;
  days: number;
}

export const passesService = {
  list: (q: PassQuery): Promise<Pass[]> =>
    apiFetchValidated('/passes', passListSchema, {
      query: {
        satellite_id: q.satellite_id,
        station_id: q.station_id,
        days: q.days,
      },
    }),
};
