import { describe, expect, it, vi } from 'vitest';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsPhoto } from './fixtures/pexels.js';

describe('authentication', () => {
  it('adds Authorization header with the API key', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 1,
        total_results: 1,
        photos: [samplePexelsPhoto],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl, { apiKey: 'secret-key-123' });
    await client.searchPhotos({ query: 'ocean' });

    const headers = new Headers(fetchMock.headers[0]);
    expect(headers.get('Authorization')).toBe('secret-key-123');
  });

  it('does not expose the API key in returned media objects', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse(samplePexelsPhoto),
    );

    const client = createTestClient(fetchMock.fetchImpl, { apiKey: 'secret-key-123' });
    const photo = await client.getPhoto(2014422);
    const serialized = JSON.stringify(photo);

    expect(serialized).not.toContain('secret-key-123');
    expect(serialized.toLowerCase()).not.toContain('authorization');
  });

  it('does not log the API key from the default console listener', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const client = createTestClient(async () => jsonResponse({}), {
      apiKey: 'secret-key-123',
      eventListeners: { defaultConsole: true },
    });

    client.trackView({ mediaId: 1, mediaType: 'photo', source: 'grid' });

    const logged = info.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).toContain('[MediaForge] view');
    expect(logged).not.toContain('secret-key-123');
    expect(logged.toLowerCase()).not.toContain('authorization');

    info.mockRestore();
  });
});
