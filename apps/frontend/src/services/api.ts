import { z } from 'zod';
import { errorEnvelopeSchema } from '@/types';

/**
 * Base URL for the API. Browser always calls relative `/api` paths so that
 * requests are same-origin (through nginx) and HttpOnly cookies are sent.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Query params appended to the URL (undefined/null values are skipped). */
  query?: Record<string, string | number | undefined | null>;
}

/** Read a cookie value by name (browser only). Used for the CSRF token. */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Central HTTP client.
 *
 * - Always sends cookies (`credentials: 'include'`).
 * - Unwraps the `{ success, data }` envelope returning `data`.
 * - Throws {@link ApiError} on `{ success: false }` or network/HTTP failures.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // Django Ninja enforces CSRF on cookie-authenticated mutations.
  if (method !== 'GET') {
    const csrf = readCookie('csrftoken');
    if (csrf) headers['X-CSRFToken'] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      headers: Object.keys(headers).length ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Falha de conexão com o servidor.', 0);
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  // Error envelope (or any non-ok without a valid success envelope).
  const errorParsed = errorEnvelopeSchema.safeParse(payload);
  if (errorParsed.success) {
    throw new ApiError(errorParsed.data.message, response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      `Erro inesperado (${response.status}).`,
      response.status,
    );
  }

  const envelope = z
    .object({ success: z.literal(true), data: z.unknown() })
    .safeParse(payload);

  if (!envelope.success) {
    throw new ApiError('Resposta do servidor em formato inesperado.', response.status);
  }

  return envelope.data.data as T;
}

/**
 * Convenience wrapper that validates the unwrapped `data` against a Zod schema.
 */
export async function apiFetchValidated<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const data = await apiFetch<unknown>(path, options);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('Dados recebidos em formato inválido.', 0);
  }
  return parsed.data;
}
