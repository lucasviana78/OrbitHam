import { apiFetchValidated } from './api';
import { dashboardSchema, type Dashboard } from '@/types';

export const dashboardService = {
  get: (): Promise<Dashboard> =>
    apiFetchValidated('/dashboard', dashboardSchema),
};
