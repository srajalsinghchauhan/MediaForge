import { describe, expect, it } from 'vitest';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto, textResponse } from './fixtures/pexels.js';

describe('request deduplication', () => {
  it('shares one in-flight promise for identical concurrent requests', async () => {
    let resolveResponse!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const fetchMock = createCountingFetch(async () => pending);
    const client = createTestClient(fetchMock.fetchImpl, {
      cache: false,
      dedupe: true,
    });

    const p1 = client.searchPhotos({ query: 'cats', page: 1 });
    const p2 = client.searchPhotos({ query: 'cats', page: 1 });

    expect(fetchMock.calls).toBe(1);

    resolveResponse(
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(r2);
    expect(fetchMock.calls).toBe(1);
  });

  it('does not dedupe different requests', async () => {
    const fetchMock = createCountingFetch(async (input) => {
      const url = String(input);
      const page = url.includes('page=2') ? 2 : 1;
      return jsonResponse({
        page,
        per_page: 15,
        total_results: 30,
        photos: [samplePexelsPhoto],
      });
    });

    const client = createTestClient(fetchMock.fetchImpl, {
      cache: false,
      dedupe: true,
    });

    await Promise.all([
      client.searchPhotos({ query: 'cats', page: 1 }),
      client.searchPhotos({ query: 'cats', page: 2 }),
    ]);

    expect(fetchMock.calls).toBe(2);
  });

  it('removes rejected requests from the dedupe map', async () => {
    let calls = 0;
    const fetchMock = createCountingFetch(async () => {
      calls += 1;
      if (calls === 1) {
        return textResponse('nope', 500);
      }
      return jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      });
    });

    const client = createTestClient(fetchMock.fetchImpl, {
      cache: false,
      dedupe: true,
    });

    await expect(client.searchPhotos({ query: 'cats' })).rejects.toBeTruthy();
    const result = await client.searchPhotos({ query: 'cats' });

    expect(result.items).toHaveLength(1);
    expect(fetchMock.calls).toBe(2);
  });

  it('can disable dedupe', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const fetchMock = createCountingFetch(async () => {
      await gate;
      return jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 1,
        photos: [samplePexelsPhoto],
      });
    });

    const client = createTestClient(fetchMock.fetchImpl, {
      cache: false,
      dedupe: false,
    });

    const p1 = client.searchPhotos({ query: 'cats', page: 1 });
    const p2 = client.searchPhotos({ query: 'cats', page: 1 });

    expect(fetchMock.calls).toBe(2);
    release();
    await Promise.all([p1, p2]);
  });
});
