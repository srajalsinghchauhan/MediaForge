import { describe, expect, it, vi } from 'vitest';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto } from './fixtures/pexels.js';

describe('cache', () => {
  it('returns cached responses on cache hit', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl, {
      cache: { ttlMs: 60_000, maxEntries: 10 },
    });

    const first = await client.searchPhotos({ query: 'cats', page: 1 });
    const second = await client.searchPhotos({ query: 'cats', page: 1 });

    expect(fetchMock.calls).toBe(1);
    expect(second).toEqual(first);
  });

  it('misses cache for different parameters', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);

    await client.searchPhotos({ query: 'cats', page: 1 });
    await client.searchPhotos({ query: 'cats', page: 2 });
    await client.searchPhotos({ query: 'dogs', page: 1 });

    expect(fetchMock.calls).toBe(3);
  });

  it('expires entries after TTL', async () => {
    vi.useFakeTimers();
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl, {
      cache: { ttlMs: 1_000, maxEntries: 10 },
    });

    await client.searchPhotos({ query: 'cats' });
    expect(fetchMock.calls).toBe(1);

    vi.advanceTimersByTime(1_001);
    await client.searchPhotos({ query: 'cats' });
    expect(fetchMock.calls).toBe(2);

    vi.useRealTimers();
  });

  it('clears the cache', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    await client.searchPhotos({ query: 'cats' });
    client.clearCache();
    await client.searchPhotos({ query: 'cats' });

    expect(fetchMock.calls).toBe(2);
  });

  it('can disable caching', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl, { cache: false, dedupe: false });
    await client.searchPhotos({ query: 'cats' });
    await client.searchPhotos({ query: 'cats' });

    expect(fetchMock.calls).toBe(2);
  });
});
