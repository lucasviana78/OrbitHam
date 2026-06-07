import { apiFetchValidated } from './api';
import { dashboardSchema, type Dashboard } from '@/types';

export const dashboardService = {
  get: (stationId?: number): Promise<Dashboard> =>
    apiFetchValidated(
      stationId != null ? `/dashboard?station_id=${stationId}` : '/dashboard',
      dashboardSchema,
    ),
};
