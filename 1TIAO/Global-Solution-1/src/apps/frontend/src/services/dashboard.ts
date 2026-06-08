import { apiFetchValidated } from './api';
import { dashboardSchema, type Dashboard } from '@/types';

export const dashboardService = {
  get: (stationId?: number, days?: number): Promise<Dashboard> => {
    const params = new URLSearchParams();
    if (stationId != null) params.set('station_id', String(stationId));
    if (days != null) params.set('days', String(days));
    const query = params.toString();
    return apiFetchValidated(
      query ? `/dashboard?${query}` : '/dashboard',
      dashboardSchema,
    );
  },
};
