import type { Video, VideoFile, VideoPicture } from '../types/media.js';
import { MediaError } from '../errors/MediaError.js';

export interface PexelsVideoFile {
  id: number;
  quality?: string;
  file_type?: string;
  width?: number | null;
  height?: number | null;
  link?: string;
}

export interface PexelsVideoPicture {
  id: number;
  nr?: number;
  picture?: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image?: string;
  duration?: number;
  user?: {
    id?: number;
    name?: string;
    url?: string;
  };
  video_files?: PexelsVideoFile[];
  video_pictures?: PexelsVideoPicture[];
}

function mapVideoFile(raw: PexelsVideoFile): VideoFile {
  return {
    id: raw.id,
    quality: raw.quality ?? '',
    fileType: raw.file_type ?? '',
    width: raw.width ?? 0,
    height: raw.height ?? 0,
    link: raw.link ?? '',
  };
}

function mapVideoPicture(raw: PexelsVideoPicture): VideoPicture {
  return {
    id: raw.id,
    nr: raw.nr ?? 0,
    picture: raw.picture ?? '',
  };
}

export function mapVideo(raw: PexelsVideo): Video {
  if (!raw || typeof raw.id !== 'number') {
    throw new MediaError({
      code: 'PARSE',
      message: 'Invalid video payload from Pexels',
      retriable: false,
    });
  }

  return {
    id: raw.id,
    type: 'video',
    width: raw.width,
    height: raw.height,
    url: raw.url,
    photographer: raw.user?.name,
    photographerUrl: raw.user?.url,
    duration: raw.duration ?? 0,
    image: raw.image ?? '',
    videoFiles: (raw.video_files ?? []).map(mapVideoFile),
    videoPictures: (raw.video_pictures ?? []).map(mapVideoPicture),
  };
}
