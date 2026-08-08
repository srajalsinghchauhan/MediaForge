import { describe, expect, it } from 'vitest';
import { createCountingFetch, createTestClient } from './helpers.js';
import { jsonResponse, samplePexelsVideo } from './fixtures/pexels.js';

describe('videos', () => {
  it('searches videos and maps the response', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 10,
        total_results: 25,
        next_page: 'https://api.pexels.com/videos/search?page=2',
        videos: [samplePexelsVideo],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    const result = await client.searchVideos({ query: 'waves', perPage: 10 });

    expect(fetchMock.urls[0]).toContain('/videos/search');
    expect(result.items[0]?.type).toBe('video');
    expect(result.items[0]?.duration).toBe(22);
    expect(result.items[0]?.videoFiles[0]?.fileType).toBe('video/mp4');
    expect(result.items[0]?.photographer).toBe('Joey Farina');
  });

  it('fetches popular videos', async () => {
    const fetchMock = createCountingFetch(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 15,
        videos: [samplePexelsVideo],
      }),
    );

    const client = createTestClient(fetchMock.fetchImpl);
    const result = await client.popularVideos();

    expect(fetchMock.urls[0]).toContain('/videos/popular');
    expect(result.items).toHaveLength(1);
  });

  it('fetches a single video', async () => {
    const fetchMock = createCountingFetch(async () => jsonResponse(samplePexelsVideo));
    const client = createTestClient(fetchMock.fetchImpl);
    const video = await client.getVideo(2499611);

    expect(fetchMock.urls[0]).toContain('/videos/videos/2499611');
    expect(video.type).toBe('video');
    expect(video.videoPictures[0]?.picture).toContain('picture-0.jpg');
  });
});
