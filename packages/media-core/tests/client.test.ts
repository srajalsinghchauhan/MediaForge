import { describe, expect, it } from 'vitest';
import { createMediaClient, MediaError } from '../src/index.js';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto } from './fixtures/pexels.js';

describe('createMediaClient', () => {
  it('creates a client with required configuration', () => {
    const client = createMediaClient({
      apiKey: 'key',
      fetch: async () => jsonResponse({}),
      eventListeners: { defaultConsole: false },
    });

    expect(typeof client.searchPhotos).toBe('function');
    expect(typeof client.clearCache).toBe('function');
  });

  it('rejects missing apiKey', () => {
    expect(() =>
      createMediaClient({
        apiKey: '   ',
        fetch: async () => jsonResponse({}),
      }),
    ).toThrow(MediaError);
  });

  it('isolates cache and events across clients', async () => {
    const fetchA = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 1,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );
    const fetchB = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 1,
        total_results: 1,
        photos: [{ ...samplePexelsPhoto, id: 99 }],
      }),
    );

    const clientA = createTestClient(fetchA.fetchImpl);
    const clientB = createTestClient(fetchB.fetchImpl);

    const eventsA: string[] = [];
    const eventsB: string[] = [];
    clientA.on('view', () => eventsA.push('a'));
    clientB.on('view', () => eventsB.push('b'));

    await clientA.searchPhotos({ query: 'cats' });
    await clientA.searchPhotos({ query: 'cats' });
    await clientB.searchPhotos({ query: 'cats' });

    clientA.trackView({ mediaId: 1, mediaType: 'photo' });
    clientB.trackView({ mediaId: 2, mediaType: 'photo' });

    expect(fetchA.calls).toBe(1);
    expect(fetchB.calls).toBe(1);
    expect(eventsA).toEqual(['a']);
    expect(eventsB).toEqual(['b']);
  });

  it('uses custom baseUrl', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 1,
        total_results: 0,
        photos: [],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl, {
      baseUrl: 'https://proxy.example.com',
    });

    await client.curatedPhotos();

    expect(fetchMock.urls[0]).toContain('https://proxy.example.com/v1/curated');
  });
});
