import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { apiFetch, apiFetchValidated, ApiError } from './api';

function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = init;
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps the success envelope and returns data', async () => {
    const fetchMock = mockFetch({ success: true, data: { id: 1 } });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch<{ id: number }>('/auth/me');
    expect(result).toEqual({ id: 1 });
  });

  it('always sends credentials: include', async () => {
    const fetchMock = mockFetch({ success: true, data: {} });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/auth/me');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('throws ApiError with the message on success:false', async () => {
    const fetchMock = mockFetch(
      { success: false, message: 'Não autenticado' },
      { ok: false, status: 401 },
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/auth/me')).rejects.toMatchObject({
      message: 'Não autenticado',
      status: 401,
    });
    await expect(apiFetch('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });

  it('serializes a JSON body and sets the content-type', async () => {
    const fetchMock = mockFetch({ success: true, data: {} });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'x' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'x' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('appends query params, skipping empty values', async () => {
    const fetchMock = mockFetch({ success: true, data: [] });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/satellites', {
      query: { search: 'ISS', category: undefined },
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('search=ISS');
    expect(url).not.toContain('category');
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    await expect(apiFetch('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('apiFetchValidated', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('validates the unwrapped data against a schema', async () => {
    const fetchMock = mockFetch({
      success: true,
      data: { id: 1, email: 'a@b.com', username: 'neo' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const schema = z.object({
      id: z.number(),
      email: z.string(),
      username: z.string(),
    });
    const result = await apiFetchValidated('/auth/me', schema);
    expect(result.username).toBe('neo');
  });

  it('throws ApiError when the data shape is invalid', async () => {
    const fetchMock = mockFetch({ success: true, data: { id: 'nope' } });
    vi.stubGlobal('fetch', fetchMock);

    const schema = z.object({ id: z.number() });
    await expect(apiFetchValidated('/x', schema)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
