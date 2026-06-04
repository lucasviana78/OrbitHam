import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createWrapper } from '@/test/utils';

const me = vi.fn();
const logout = vi.fn();
const dashboardGet = vi.fn();
const passesList = vi.fn();
const satellitesList = vi.fn();
const createStation = vi.fn();
const updateStation = vi.fn();
const removeStation = vi.fn();

vi.mock('@/services/auth', () => ({
  authService: { me: () => me(), logout: () => logout() },
}));
vi.mock('@/services/dashboard', () => ({
  dashboardService: { get: () => dashboardGet() },
}));
vi.mock('@/services/passes', () => ({
  passesService: { list: (q: unknown) => passesList(q) },
}));
vi.mock('@/services/satellites', () => ({
  satellitesService: { list: (s?: string) => satellitesList(s) },
}));
vi.mock('@/services/stations', () => ({
  stationsService: {
    list: vi.fn().mockResolvedValue([]),
    create: (i: unknown) => createStation(i),
    update: (id: number, i: unknown) => updateStation(id, i),
    remove: (id: number) => removeStation(id),
  },
}));

import { useMe, useLogout } from './use-auth';
import { useDashboard } from './use-dashboard';
import { usePasses } from './use-passes';
import { useSatellites } from './use-satellites';
import {
  useCreateStation,
  useUpdateStation,
  useDeleteStation,
} from './use-stations';
import { useAuthStore } from '@/stores/auth-store';

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clear();
});

describe('useMe', () => {
  it('stores the user on success', async () => {
    me.mockResolvedValue({ id: 1, email: 'a@b.com', username: 'neo' });
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().user?.username).toBe('neo');
  });
});

describe('useLogout', () => {
  it('clears the store on success', async () => {
    useAuthStore.getState().setUser({ id: 1, email: 'a@b.com', username: 'neo' });
    logout.mockResolvedValue({});
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('useDashboard', () => {
  it('fetches dashboard data', async () => {
    dashboardGet.mockResolvedValue({
      active_satellites_count: 2,
      total_stations: 1,
      next_passes: [],
      active_satellites: [],
    });
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.active_satellites_count).toBe(2);
  });
});

describe('usePasses', () => {
  it('is disabled until both ids are present', () => {
    const { result } = renderHook(() => usePasses({ station_id: 1 }), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(passesList).not.toHaveBeenCalled();
  });

  it('queries when both ids are present', async () => {
    passesList.mockResolvedValue([]);
    renderHook(
      () => usePasses({ station_id: 1, satellite_id: 2, days: 4 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() =>
      expect(passesList).toHaveBeenCalledWith({
        station_id: 1,
        satellite_id: 2,
        days: 4,
      }),
    );
  });
});

describe('useSatellites', () => {
  it('passes the search term to the service', async () => {
    satellitesList.mockResolvedValue([]);
    renderHook(() => useSatellites('ISS'), { wrapper: createWrapper() });
    await waitFor(() => expect(satellitesList).toHaveBeenCalledWith('ISS'));
  });
});

describe('station mutations', () => {
  it('create calls the service', async () => {
    createStation.mockResolvedValue({});
    const input = {
      name: 'B',
      callsign: 'PU2ABC',
      latitude: 0,
      longitude: 0,
      altitude: 0,
    };
    const { result } = renderHook(() => useCreateStation(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(input);
    });
    expect(createStation).toHaveBeenCalledWith(input);
  });

  it('update calls the service with id', async () => {
    updateStation.mockResolvedValue({});
    const input = {
      name: 'B',
      callsign: 'PU2ABC',
      latitude: 0,
      longitude: 0,
      altitude: 0,
    };
    const { result } = renderHook(() => useUpdateStation(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync({ id: 3, input });
    });
    expect(updateStation).toHaveBeenCalledWith(3, input);
  });

  it('delete calls the service', async () => {
    removeStation.mockResolvedValue({});
    const { result } = renderHook(() => useDeleteStation(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(7);
    });
    expect(removeStation).toHaveBeenCalledWith(7);
  });
});
