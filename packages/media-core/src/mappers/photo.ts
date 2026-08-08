import type { Photo } from '../types/media.js';
import { MediaError } from '../errors/MediaError.js';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer?: string;
  photographer_url?: string;
  avg_color?: string;
  alt?: string;
  src?: {
    original?: string;
    large?: string;
    medium?: string;
    small?: string;
    tiny?: string;
    large2x?: string;
  };
}

export function mapPhoto(raw: PexelsPhoto): Photo {
  if (!raw || typeof raw.id !== 'number') {
    throw new MediaError({
      code: 'PARSE',
      message: 'Invalid photo payload from Pexels',
      retriable: false,
    });
  }

  const src = raw.src ?? {};

  return {
    id: raw.id,
    type: 'photo',
    width: raw.width,
    height: raw.height,
    url: raw.url,
    alt: raw.alt,
    photographer: raw.photographer,
    photographerUrl: raw.photographer_url,
    avgColor: raw.avg_color,
    src: {
      original: src.original ?? '',
      large: src.large ?? src.large2x ?? '',
      medium: src.medium ?? '',
      small: src.small ?? '',
      thumbnail: src.tiny ?? src.small ?? '',
    },
  };
}
