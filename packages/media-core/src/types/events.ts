import type { MediaType } from './media.js';

export type MediaEventType = 'view' | 'download';

export interface MediaViewPayload {
  mediaId: number | string;
  mediaType: MediaType;
  source?: 'grid' | 'lightbox' | 'reel' | 'other';
  query?: string;
  page?: number;
  at?: string;
}

export interface MediaDownloadPayload {
  mediaId: number | string;
  mediaType: MediaType;
  source?: 'lightbox' | 'reel' | 'other';
  at?: string;
}

export type MediaEvent =
  | {
      type: 'view';
      payload: MediaViewPayload;
    }
  | {
      type: 'download';
      payload: MediaDownloadPayload;
    };

export type MediaEventListener = (event: MediaEvent) => void;
