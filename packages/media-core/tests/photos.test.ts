import { describe, expect, it } from 'vitest';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto } from './fixtures/pexels.js';

describe('photos', () => {
  it('searches photos and maps the response', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 2,
        per_page: 15,
        total_results: 40,
        next_page: 'https://api.pexels.com/v1/search?page=3',
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    const result = await client.searchPhotos({
      query: 'mountains',
      page: 2,
      orientation: 'landscape',
    });

    expect(fetchMock.urls[0]).toContain('/v1/search');
    expect(fetchMock.urls[0]).toContain('query=mountains');
    expect(fetchMock.urls[0]).toContain('page=2');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe('photo');
    expect(result.items[0]?.src.thumbnail).toContain('tiny.jpeg');
    expect(result.items[0]?.photographerUrl).toBe('https://www.pexels.com/@joey');
  });

  it('fetches curated photos', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 15,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    const result = await client.curatedPhotos({ page: 1, perPage: 15 });

    expect(fetchMock.urls[0]).toContain('/v1/curated');
    expect(result.items[0]?.id).toBe(2014422);
  });

  it('fetches a single photo', async () => {
    const fetchMock = createCountingFetch(async () => jsonResponse(samplePexelsPhoto));
    const client = createTestClient(fetchMock.fetchImpl);
    const photo = await client.getPhoto(2014422);

    expect(fetchMock.urls[0]).toContain('/v1/photos/2014422');
    expect(photo.type).toBe('photo');
    expect(photo.src.medium).toContain('medium.jpeg');
  });
});
