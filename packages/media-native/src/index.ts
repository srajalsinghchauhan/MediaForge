export type { AsyncState, QueryStatus, SearchResultState } from './types.js';
export type { MediaProviderProps } from './MediaProvider.js';
export type { MediaEventActions } from './useMediaEvents.js';

export { MediaProvider } from './MediaProvider.js';
export { useMediaClient } from './useMediaClient.js';
export { useSearchPhotos } from './useSearchPhotos.js';
export { useSearchVideos } from './useSearchVideos.js';
export { useCuratedPhotos } from './useCuratedPhotos.js';
export { useMediaItem } from './useMediaItem.js';
export { useMediaEvents } from './useMediaEvents.js';

export type {
  Media,
  MediaClient,
  MediaClientConfig,
  MediaDownloadPayload,
  MediaEvent,
  MediaEventListener,
  MediaEventType,
  MediaItemParams,
  MediaViewPayload,
  PageResult,
  Photo,
  SearchParams,
  CuratedParams,
  Video,
} from '@mediaforge/core';

export { MediaError, isMediaError, createMediaClient } from '@mediaforge/core';
