import { describe, expect, it } from 'vitest';
import { MediaError, isMediaError } from '../src/index.js';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, textResponse } from './fixtures/pexels.js';

describe('errors', () => {
  it.each([
    [400, 'BAD_REQUEST', false],
    [401, 'UNAUTHORIZED', false],
    [403, 'FORBIDDEN', false],
    [404, 'NOT_FOUND', false],
    [429, 'RATE_LIMITED', true],
  ] as const)('maps HTTP %i to %s', async (status, code, retriable) => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({ error: 'failed' }, status),
    );
    const client = createTestClient(fetchMock.fetchImpl, { cache: false, dedupe: false });

    await expect(client.getPhoto(1)).rejects.toMatchObject({
      name: 'MediaError',
      code,
      status,
      retriable,
    });
  });

  it('maps network failures to NETWORK', async () => {
    const fetchMock = createCountingFetch(async () => {
      throw new TypeError('fetch failed');
    });
    const client = createTestClient(fetchMock.fetchImpl, { cache: false, dedupe: false });

    try {
      await client.searchPhotos({ query: 'cats' });
      expect.fail('expected error');
    } catch (error) {
      expect(isMediaError(error)).toBe(true);
      expect((error as MediaError).code).toBe('NETWORK');
      expect((error as MediaError).retriable).toBe(true);
    }
  });

  it('maps abort errors to TIMEOUT', async () => {
    const fetchMock = createCountingFetch(async () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      throw error;
    });
    const client = createTestClient(fetchMock.fetchImpl, { cache: false, dedupe: false });

    await expect(client.curatedPhotos()).rejects.toMatchObject({
      code: 'TIMEOUT',
      retriable: true,
    });
  });

  it('maps invalid JSON to PARSE', async () => {
    const fetchMock = createCountingFetch(async () => textResponse('{not-json', 200));
    const client = createTestClient(fetchMock.fetchImpl, { cache: false, dedupe: false });

    await expect(client.getPhoto(1)).rejects.toMatchObject({
      code: 'PARSE',
    });
  });

  it('rejects empty search queries as BAD_REQUEST', async () => {
    const fetchMock = createCountingFetch(async () => jsonResponse({ photos: [] }));
    const client = createTestClient(fetchMock.fetchImpl);

    await expect(client.searchPhotos({ query: '   ' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(fetchMock.calls).toBe(0);
  });

  it('does not include the API key in error details', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse(
        {
          error: 'unauthorized',
          authorization: 'secret-key-123',
          api_key: 'secret-key-123',
        },
        401,
      ),
    );
    const client = createTestClient(fetchMock.fetchImpl, {
      apiKey: 'secret-key-123',
      cache: false,
      dedupe: false,
    });

    try {
      await client.getPhoto(1);
      expect.fail('expected error');
    } catch (error) {
      const serialized = JSON.stringify(error);
      expect(serialized).not.toContain('secret-key-123');
      expect((error as MediaError).details).toEqual({ error: 'unauthorized' });
    }
  });
});
