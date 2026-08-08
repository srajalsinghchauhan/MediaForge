import { vi } from 'vitest';
import type {
  MediaClient,
  MediaEvent,
  MediaEventListener,
  MediaEventType,
  PageResult,
  Photo,
  Video,
} from '@mediaforge/core';
import { MediaError } from '@mediaforge/core';
import { MediaProvider } from '../src/MediaProvider.js';
import type { ReactNode } from 'react';

export function createPhoto(id = 1): Photo {
  return {
    id,
    type: 'photo',
    width: 100,
    height: 100,
    url: `https://example.com/photos/${id}`,
    src: {
      original: `https://example.com/${id}-original.jpg`,
      large: `https://example.com/${id}-large.jpg`,
      medium: `https://example.com/${id}-medium.jpg`,
      small: `https://example.com/${id}-small.jpg`,
      thumbnail: `https://example.com/${id}-thumb.jpg`,
    },
  };
}

export function createVideo(id = 2): Video {
  return {
    id,
    type: 'video',
    width: 1920,
    height: 1080,
    url: `https://example.com/videos/${id}`,
    duration: 10,
    image: `https://example.com/${id}.jpg`,
    videoFiles: [],
    videoPictures: [],
  };
}

export function pageResult<T>(items: T[], page = 1, totalResults = 30): PageResult<T> {
  return {
    items,
    pageInfo: {
      page,
      perPage: 15,
      totalResults,
      nextPage: page * 15 < totalResults ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

export function createFakeClient(overrides: Partial<MediaClient> = {}): MediaClient {
  const listeners = new Map<MediaEventType, Set<MediaEventListener>>();

  const client: MediaClient = {
    searchPhotos: vi.fn(async () => pageResult([createPhoto()])),
    searchVideos: vi.fn(async () => pageResult([createVideo()])),
    curatedPhotos: vi.fn(async () => pageResult([createPhoto(3)])),
    popularVideos: vi.fn(async () => pageResult([createVideo(4)])),
    getPhoto: vi.fn(async (id) => createPhoto(Number(id))),
    getVideo: vi.fn(async (id) => createVideo(Number(id))),
    on: vi.fn((type, listener) => {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(listener);
      return () => {
        set?.delete(listener);
      };
    }),
    off: vi.fn((type, listener) => {
      listeners.get(type)?.delete(listener);
    }),
    trackView: vi.fn((payload) => {
      const event: MediaEvent = { type: 'view', payload };
      for (const listener of listeners.get('view') ?? []) {
        listener(event);
      }
    }),
    trackDownload: vi.fn((payload) => {
      const event: MediaEvent = { type: 'download', payload };
      for (const listener of listeners.get('download') ?? []) {
        listener(event);
      }
    }),
    clearCache: vi.fn(),
    ...overrides,
  };

  return client;
}

export function createNotFoundError() {
  return new MediaError({
    code: 'NOT_FOUND',
    message: 'Not found',
    status: 404,
    retriable: false,
  });
}

export function createRateLimitError() {
  return new MediaError({
    code: 'RATE_LIMITED',
    message: 'Rate limited',
    status: 429,
    retriable: true,
  });
}

export function renderWithClient(client: MediaClient, ui: ReactNode) {
  return <MediaProvider client={client}>{ui}</MediaProvider>;
}
