import { createMediaClient } from '../src/index.js';
import type { MediaClientConfig } from '../src/index.js';

export function createTestClient(
  fetchImpl: typeof fetch,
  overrides: Partial<MediaClientConfig> = {},
) {
  return createMediaClient({
    apiKey: 'test-api-key',
    fetch: fetchImpl,
    eventListeners: { defaultConsole: false },
    cache: { ttlMs: 60_000, maxEntries: 50 },
    dedupe: true,
    ...overrides,
  });
}

export function createCountingFetch(
  handler: (input: string, init?: RequestInit) => Promise<Response>,
) {
  let calls = 0;
  const urls: string[] = [];
  const headers: Array<RequestInit['headers'] | undefined> = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    calls += 1;
    const url = String(input);
    urls.push(url);
    headers.push(init?.headers);
    return handler(url, init);
  };

  return {
    fetchImpl,
    get calls() {
      return calls;
    },
    get urls() {
      return urls;
    },
    get headers() {
      return headers;
    },
  };
}
