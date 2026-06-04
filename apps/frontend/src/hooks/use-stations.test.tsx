import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/utils';
import { useStations } from './use-stations';

const mockList = vi.fn();
vi.mock('@/services/stations', () => ({
  stationsService: {
    list: () => mockList(),
  },
}));

describe('useStations', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns the station list from the service', async () => {
    mockList.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        name: 'Base',
        callsign: 'PU2ABC',
        latitude: -23,
        longitude: -46,
        altitude: 700,
      },
    ]);

    const { result } = renderHook(() => useStations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].callsign).toBe('PU2ABC');
  });

  it('surfaces errors from the service', async () => {
    mockList.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useStations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
