export type { Media, MediaBase, MediaType, Photo, Video, VideoFile, VideoPicture } from './types/media.js';
export type { PageInfo, PageResult } from './types/pagination.js';
export type { CuratedParams, MediaItemParams, SearchParams } from './types/params.js';
export type { CacheConfig, MediaClientConfig } from './types/config.js';
export type {
  MediaDownloadPayload,
  MediaEvent,
  MediaEventListener,
  MediaEventType,
  MediaViewPayload,
} from './types/events.js';
export type { MediaErrorCode, MediaErrorShape } from './types/errors.js';
export type { MediaClient } from './types/client.js';

export { MediaError, isMediaError } from './errors/MediaError.js';
export { createMediaClient } from './client/createMediaClient.js';
