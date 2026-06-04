import { apiFetch, apiFetchValidated } from './api';
import {
  stationSchema,
  stationListSchema,
  type Station,
  type StationFormInput,
} from '@/types';

export const stationsService = {
  list: (): Promise<Station[]> =>
    apiFetchValidated('/stations', stationListSchema),

  create: (input: StationFormInput): Promise<Station> =>
    apiFetchValidated('/stations', stationSchema, {
      method: 'POST',
      body: input,
    }),

  update: (id: number, input: StationFormInput): Promise<Station> =>
    apiFetchValidated(`/stations/${id}`, stationSchema, {
      method: 'PUT',
      body: input,
    }),

  remove: (id: number): Promise<unknown> =>
    apiFetch(`/stations/${id}`, { method: 'DELETE' }),
};
