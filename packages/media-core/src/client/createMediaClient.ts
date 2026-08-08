import { MemoryCache } from '../cache/MemoryCache.js';
import { EventEmitter, createDefaultConsoleListener } from '../events/EventEmitter.js';
import { HttpClient, createCacheKey } from '../http/HttpClient.js';
import { MediaError } from '../errors/MediaError.js';
import { mapPhoto, type PexelsPhoto } from '../mappers/photo.js';
import { mapVideo, type PexelsVideo } from '../mappers/video.js';
import { createPageResult, type PexelsPageMeta } from '../mappers/pagination.js';
import type { MediaClient } from '../types/client.js';
import type { MediaClientConfig } from '../types/config.js';
import type { Photo, Video } from '../types/media.js';
import type { PageResult } from '../types/pagination.js';
import type { CuratedParams, SearchParams } from '../types/params.js';
import type {
  MediaDownloadPayload,
  MediaEventListener,
  MediaEventType,
  MediaViewPayload,
} from '../types/events.js';
import {
  DEFAULT_BASE_URL,
  DEFAULT_CACHE_MAX_ENTRIES,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_CONSOLE_LISTENER,
  DEFAULT_DEDUPE,
  DEFAULT_PER_PAGE,
} from './defaults.js';

interface PhotoListResponse extends PexelsPageMeta {
  photos?: PexelsPhoto[];
}

interface VideoListResponse extends PexelsPageMeta {
  videos?: PexelsVideo[];
}

function resolveFetch(fetchImpl?: typeof fetch): typeof fetch {
  if (fetchImpl) {
    return fetchImpl;
  }
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  throw new MediaError({
    code: 'UNKNOWN',
    message: 'No fetch implementation available. Pass config.fetch.',
    retriable: false,
  });
}

function normalizePage(page?: number): number {
  if (page === undefined || Number.isNaN(page)) {
    return 1;
  }
  return Math.max(1, Math.floor(page));
}

function normalizePerPage(perPage: number | undefined, fallback: number): number {
  if (perPage === undefined || Number.isNaN(perPage)) {
    return fallback;
  }
  return Math.max(1, Math.floor(perPage));
}

function assertSearchQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new MediaError({
      code: 'BAD_REQUEST',
      message: 'Search query must be a non-empty string',
      retriable: false,
    });
  }
  return trimmed;
}

export function createMediaClient(config: MediaClientConfig): MediaClient {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new MediaError({
      code: 'BAD_REQUEST',
      message: 'apiKey is required',
      retriable: false,
    });
  }

  const apiKey = config.apiKey.trim();
  const baseUrl = config.baseUrl?.trim() || DEFAULT_BASE_URL;
  const defaultPerPage = normalizePerPage(config.defaultPerPage, DEFAULT_PER_PAGE);
  const dedupeEnabled = config.dedupe ?? DEFAULT_DEDUPE;
  const fetchImpl = resolveFetch(config.fetch);

  const cacheConfig = config.cache === false ? undefined : config.cache;
  const cache =
    config.cache === false
      ? null
      : new MemoryCache({
          ttlMs: cacheConfig?.ttlMs ?? DEFAULT_CACHE_TTL_MS,
          maxEntries: cacheConfig?.maxEntries ?? DEFAULT_CACHE_MAX_ENTRIES,
        });

  const http = new HttpClient({ apiKey, baseUrl, fetchImpl });
  const events = new EventEmitter();
  const inflight = new Map<string, Promise<unknown>>();

  const defaultConsole = config.eventListeners?.defaultConsole ?? DEFAULT_CONSOLE_LISTENER;
  if (defaultConsole) {
    events.on('view', createDefaultConsoleListener());
    events.on('download', createDefaultConsoleListener());
  }

  async function requestCached<T>(
    cacheKey: string,
    execute: () => Promise<T>,
  ): Promise<T> {
    if (cache) {
      const hit = cache.get<T>(cacheKey);
      if (hit !== undefined) {
        return hit;
      }
    }

    if (dedupeEnabled) {
      const existing = inflight.get(cacheKey);
      if (existing) {
        return existing as Promise<T>;
      }
    }

    const promise = execute()
      .then((result) => {
        if (cache) {
          cache.set(cacheKey, result);
        }
        return result;
      })
      .finally(() => {
        inflight.delete(cacheKey);
      });

    if (dedupeEnabled) {
      inflight.set(cacheKey, promise);
    }

    return promise;
  }

  async function searchPhotos(params: SearchParams): Promise<PageResult<Photo>> {
    const query = assertSearchQuery(params.query);
    const page = normalizePage(params.page);
    const perPage = normalizePerPage(params.perPage, defaultPerPage);

    const queryParams: Record<string, string | number | undefined> = {
      query,
      page,
      per_page: perPage,
      orientation: params.orientation,
      size: params.size,
      locale: params.locale,
      color: params.color,
    };

    const cacheKey = createCacheKey('searchPhotos', queryParams);

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<PhotoListResponse>({
        path: '/v1/search',
        query: queryParams,
      });
      return createPageResult(
        (raw.photos ?? []).map(mapPhoto),
        raw,
        { page, perPage },
      );
    });
  }

  async function searchVideos(params: SearchParams): Promise<PageResult<Video>> {
    const query = assertSearchQuery(params.query);
    const page = normalizePage(params.page);
    const perPage = normalizePerPage(params.perPage, defaultPerPage);

    const queryParams: Record<string, string | number | undefined> = {
      query,
      page,
      per_page: perPage,
      orientation: params.orientation,
      size: params.size,
      locale: params.locale,
    };

    const cacheKey = createCacheKey('searchVideos', queryParams);

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<VideoListResponse>({
        path: '/videos/search',
        query: queryParams,
      });
      return createPageResult(
        (raw.videos ?? []).map(mapVideo),
        raw,
        { page, perPage },
      );
    });
  }

  async function curatedPhotos(params: CuratedParams = {}): Promise<PageResult<Photo>> {
    const page = normalizePage(params.page);
    const perPage = normalizePerPage(params.perPage, defaultPerPage);
    const queryParams = { page, per_page: perPage };
    const cacheKey = createCacheKey('curatedPhotos', queryParams);

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<PhotoListResponse>({
        path: '/v1/curated',
        query: queryParams,
      });
      return createPageResult(
        (raw.photos ?? []).map(mapPhoto),
        raw,
        { page, perPage },
      );
    });
  }

  async function popularVideos(params: CuratedParams = {}): Promise<PageResult<Video>> {
    const page = normalizePage(params.page);
    const perPage = normalizePerPage(params.perPage, defaultPerPage);
    const queryParams = { page, per_page: perPage };
    const cacheKey = createCacheKey('popularVideos', queryParams);

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<VideoListResponse>({
        path: '/videos/popular',
        query: queryParams,
      });
      return createPageResult(
        (raw.videos ?? []).map(mapVideo),
        raw,
        { page, perPage },
      );
    });
  }

  async function getPhoto(id: number | string): Promise<Photo> {
    if (id === '' || id === null || id === undefined) {
      throw new MediaError({
        code: 'BAD_REQUEST',
        message: 'Photo id is required',
        retriable: false,
      });
    }

    const cacheKey = createCacheKey('getPhoto', { id: String(id) });

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<PexelsPhoto>({
        path: `/v1/photos/${encodeURIComponent(String(id))}`,
      });
      return mapPhoto(raw);
    });
  }

  async function getVideo(id: number | string): Promise<Video> {
    if (id === '' || id === null || id === undefined) {
      throw new MediaError({
        code: 'BAD_REQUEST',
        message: 'Video id is required',
        retriable: false,
      });
    }

    const cacheKey = createCacheKey('getVideo', { id: String(id) });

    return requestCached(cacheKey, async () => {
      const raw = await http.getJson<PexelsVideo>({
        path: `/videos/videos/${encodeURIComponent(String(id))}`,
      });
      return mapVideo(raw);
    });
  }

  function on(type: MediaEventType, listener: MediaEventListener): () => void {
    return events.on(type, listener);
  }

  function off(type: MediaEventType, listener: MediaEventListener): void {
    events.off(type, listener);
  }

  function trackView(payload: MediaViewPayload): void {
    events.emit({
      type: 'view',
      payload: {
        ...payload,
        at: payload.at ?? new Date().toISOString(),
      },
    });
  }

  function trackDownload(payload: MediaDownloadPayload): void {
    events.emit({
      type: 'download',
      payload: {
        ...payload,
        at: payload.at ?? new Date().toISOString(),
      },
    });
  }

  function clearCache(): void {
    cache?.clear();
  }

  return {
    searchPhotos,
    searchVideos,
    curatedPhotos,
    popularVideos,
    getPhoto,
    getVideo,
    on,
    off,
    trackView,
    trackDownload,
    clearCache,
  };
}
