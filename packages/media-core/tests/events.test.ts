import { describe, expect, it, vi } from 'vitest';
import { createTestClient } from './helpers.js';
import { jsonResponse } from './fixtures/pexels.js';
import type { MediaEvent } from '../src/index.js';

describe('events', () => {
  it('emits view and download events with payloads', () => {
    const client = createTestClient(async () => jsonResponse({}));
    const events: MediaEvent[] = [];

    client.on('view', (event) => events.push(event));
    client.on('download', (event) => events.push(event));

    client.trackView({
      mediaId: 10,
      mediaType: 'photo',
      source: 'grid',
      query: 'cats',
      page: 1,
      at: '2026-01-01T00:00:00.000Z',
    });
    client.trackDownload({
      mediaId: 11,
      mediaType: 'video',
      source: 'lightbox',
      at: '2026-01-01T00:00:01.000Z',
    });

    expect(events).toEqual([
      {
        type: 'view',
        payload: {
          mediaId: 10,
          mediaType: 'photo',
          source: 'grid',
          query: 'cats',
          page: 1,
          at: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        type: 'download',
        payload: {
          mediaId: 11,
          mediaType: 'video',
          source: 'lightbox',
          at: '2026-01-01T00:00:01.000Z',
        },
      },
    ]);
  });

  it('supports multiple listeners and unsubscribe cleanup', () => {
    const client = createTestClient(async () => jsonResponse({}));
    const a: string[] = [];
    const b: string[] = [];

    const unsubscribeA = client.on('view', () => a.push('a'));
    const listenerB = () => b.push('b');
    client.on('view', listenerB);

    client.trackView({ mediaId: 1, mediaType: 'photo' });
    unsubscribeA();
    client.off('view', listenerB);
    client.trackView({ mediaId: 2, mediaType: 'photo' });

    expect(a).toEqual(['a']);
    expect(b).toEqual(['b']);
  });

  it('does not let a throwing listener break others', () => {
    const client = createTestClient(async () => jsonResponse({}));
    const received: number[] = [];

    client.on('view', () => {
      throw new Error('boom');
    });
    client.on('view', (event) => {
      received.push(Number(event.payload.mediaId));
    });

    expect(() => client.trackView({ mediaId: 5, mediaType: 'photo' })).not.toThrow();
    expect(received).toEqual([5]);
  });

  it('registers a default console listener unless disabled', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    const enabled = createTestClient(async () => jsonResponse({}), {
      eventListeners: { defaultConsole: true },
    });
    enabled.trackDownload({ mediaId: 9, mediaType: 'photo', source: 'reel' });

    expect(info).toHaveBeenCalled();
    const message = String(info.mock.calls[0]?.[0]);
    expect(message).toContain('[MediaForge] download');
    expect(message).toContain('mediaId: 9');

    info.mockClear();

    const disabled = createTestClient(async () => jsonResponse({}), {
      eventListeners: { defaultConsole: false },
    });
    disabled.trackView({ mediaId: 1, mediaType: 'photo' });
    expect(info).not.toHaveBeenCalled();

    info.mockRestore();
  });

  it('does not emit view/download automatically from API calls', async () => {
    const client = createTestClient(async () =>
      jsonResponse({
        page: 1,
        per_page: 15,
        total_results: 0,
        photos: [],
      }),
    );

    const events: MediaEvent[] = [];
    client.on('view', (event) => events.push(event));
    client.on('download', (event) => events.push(event));

    await client.searchPhotos({ query: 'cats' });
    expect(events).toHaveLength(0);
  });
});
