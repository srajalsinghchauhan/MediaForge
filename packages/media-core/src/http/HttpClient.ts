import { MediaError, isRetriableCode, mapStatusToCode } from '../errors/MediaError.js';

export interface HttpClientOptions {
  apiKey: string;
  baseUrl: string;
  fetchImpl: typeof fetch;
}

export interface HttpRequestOptions {
  path: string;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function sanitizeErrorDetails(details: unknown): unknown {
  if (details === null || details === undefined) {
    return details;
  }

  if (typeof details === 'string') {
    return details;
  }

  if (typeof details !== 'object') {
    return details;
  }

  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('authorization') ||
      lower.includes('api_key') ||
      lower.includes('apikey') ||
      lower === 'key'
    ) {
      continue;
    }
    clone[key] = value;
  }
  return clone;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.fetchImpl = options.fetchImpl;
  }

  async getJson<T>(options: HttpRequestOptions): Promise<T> {
    const url = buildUrl(this.baseUrl, options.path, options.query);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new MediaError({
          code: 'TIMEOUT',
          message: 'Request was aborted or timed out',
          retriable: true,
          cause: error,
        });
      }

      throw new MediaError({
        code: 'NETWORK',
        message: 'Network request failed',
        retriable: true,
        cause: error,
      });
    }

    if (!response.ok) {
      const code = mapStatusToCode(response.status);
      let details: unknown;
      try {
        details = sanitizeErrorDetails(await response.json());
      } catch {
        try {
          details = await response.text();
        } catch {
          details = undefined;
        }
      }

      throw new MediaError({
        code,
        message: `Pexels API request failed with status ${response.status}`,
        status: response.status,
        details,
        retriable: isRetriableCode(code),
      });
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new MediaError({
        code: 'PARSE',
        message: 'Failed to parse JSON response',
        status: response.status,
        retriable: false,
        cause: error,
      });
    }
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  );
}

export function createCacheKey(method: string, query: Record<string, string | number | undefined> = {}): string {
  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`);

  return `${method}?${parts.join('&')}`;
}
