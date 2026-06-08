import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiFetch = vi.fn();
const apiFetchValidated = vi.fn();

vi.mock('./api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiFetchValidated: (...args: unknown[]) => apiFetchValidated(...args),
}));

import { authService } from './auth';
import { stationsService } from './stations';
import { satellitesService } from './satellites';
import { passesService } from './passes';
import { dashboardService } from './dashboard';

beforeEach(() => {
  apiFetch.mockReset().mockResolvedValue({});
  apiFetchValidated.mockReset().mockResolvedValue({});
});

describe('authService', () => {
  it('login POSTs to /auth/login with body', async () => {
    await authService.login({ email: 'a@b.com', password: 'x' });
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/auth/login',
      expect.anything(),
      { method: 'POST', body: { email: 'a@b.com', password: 'x' } },
    );
  });

  it('register POSTs to /auth/register', async () => {
    await authService.register({
      email: 'a@b.com',
      username: 'neo',
      password: 'secret123',
    });
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/auth/register',
      expect.anything(),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('me GETs /auth/me', async () => {
    await authService.me();
    expect(apiFetchValidated).toHaveBeenCalledWith('/auth/me', expect.anything());
  });

  it('logout POSTs to /auth/logout', async () => {
    await authService.logout();
    expect(apiFetch).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
  });
});

describe('stationsService', () => {
  it('list GETs /stations', async () => {
    await stationsService.list();
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/stations',
      expect.anything(),
    );
  });

  it('create POSTs the form input', async () => {
    const input = {
      name: 'Base',
      callsign: 'PU2ABC',
      latitude: -23,
      longitude: -46,
      altitude: 700,
    };
    await stationsService.create(input);
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/stations',
      expect.anything(),
      { method: 'POST', body: input },
    );
  });

  it('update PUTs to /stations/{id}', async () => {
    const input = {
      name: 'Base',
      callsign: 'PU2ABC',
      latitude: -23,
      longitude: -46,
      altitude: 700,
    };
    await stationsService.update(5, input);
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/stations/5',
      expect.anything(),
      { method: 'PUT', body: input },
    );
  });

  it('remove DELETEs /stations/{id}', async () => {
    await stationsService.remove(9);
    expect(apiFetch).toHaveBeenCalledWith('/stations/9', { method: 'DELETE' });
  });
});

describe('satellitesService', () => {
  it('passes search and category as query', async () => {
    await satellitesService.list('ISS', 'amateur');
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/satellites',
      expect.anything(),
      { query: { search: 'ISS', category: 'amateur' } },
    );
  });
});

describe('passesService', () => {
  it('forwards the required query params', async () => {
    await passesService.list({ satellite_id: 1, station_id: 2, days: 5 });
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/passes',
      expect.anything(),
      { query: { satellite_id: 1, station_id: 2, days: 5 } },
    );
  });
});

describe('dashboardService', () => {
  it('GETs /dashboard', async () => {
    await dashboardService.get();
    expect(apiFetchValidated).toHaveBeenCalledWith(
      '/dashboard',
      expect.anything(),
    );
  });
});
