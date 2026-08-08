import type { Photo, Video } from './media.js';
import type { PageResult } from './pagination.js';
import type { CuratedParams, SearchParams } from './params.js';
import type {
  MediaDownloadPayload,
  MediaEventListener,
  MediaEventType,
  MediaViewPayload,
} from './events.js';

export interface MediaClient {
  searchPhotos(params: SearchParams): Promise<PageResult<Photo>>;
  searchVideos(params: SearchParams): Promise<PageResult<Video>>;
  curatedPhotos(params?: CuratedParams): Promise<PageResult<Photo>>;
  popularVideos(params?: CuratedParams): Promise<PageResult<Video>>;
  getPhoto(id: number | string): Promise<Photo>;
  getVideo(id: number | string): Promise<Video>;
  on(type: MediaEventType, listener: MediaEventListener): () => void;
  off(type: MediaEventType, listener: MediaEventListener): void;
  trackView(payload: MediaViewPayload): void;
  trackDownload(payload: MediaDownloadPayload): void;
  clearCache(): void;
}
