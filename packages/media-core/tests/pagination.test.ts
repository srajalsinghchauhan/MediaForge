import { describe, expect, it } from 'vitest';
import { mapPageInfo } from '../src/mappers/pagination.js';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto } from './fixtures/pexels.js';

describe('pagination', () => {
  it('maps next and previous pages from Pexels metadata', () => {
    const info = mapPageInfo(
      {
        page: 2,
        per_page: 15,
        total_results: 100,
        next_page: 'https://api.pexels.com/v1/search?page=3',
        prev_page: 'https://api.pexels.com/v1/search?page=1',
      },
      { page: 2, perPage: 15 },
    );

    expect(info.page).toBe(2);
    expect(info.perPage).toBe(15);
    expect(info.totalResults).toBe(100);
    expect(info.nextPage).toBe(3);
    expect(info.prevPage).toBe(1);
  });

  it('derives nextPage null when results are exhausted', () => {
    const info = mapPageInfo(
      {
        page: 2,
        per_page: 15,
        total_results: 30,
      },
      { page: 2, perPage: 15 },
    );

    expect(info.nextPage).toBe(null);
    expect(info.prevPage).toBe(1);
  });

  it('returns pageInfo on search results', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 45,
        next_page: 'https://api.pexels.com/v1/search?page=2',
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    const result = await client.searchPhotos({ query: 'forest' });

    expect(result.pageInfo.totalResults).toBe(45);
    expect(result.pageInfo.nextPage).toBe(2);
    expect(result.pageInfo.prevPage).toBe(null);
  });
});
