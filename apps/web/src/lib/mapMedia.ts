import type { Photo, Video } from '@mediaforge/react';
import type { UiMediaItem } from '@mediaforge/ui-react';

export interface AppMediaItem extends UiMediaItem {
  photographer?: string;
  downloadUrl?: string;
  pageUrl?: string;
}

function pickVideoPreview(video: Video): string {
  const preferred =
    video.videoFiles.find((file) => file.quality === 'hd' && file.link) ??
    video.videoFiles.find((file) => file.link) ??
    null;

  return preferred?.link || video.image || '';
}

export function mapPhotoToUiItem(photo: Photo): AppMediaItem {
  return {
    id: photo.id,
    type: 'photo',
    title: photo.photographer,
    alt: photo.alt || photo.photographer || `Photo ${photo.id}`,
    previewUrl: photo.src.medium || photo.src.large || photo.src.original,
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    downloadUrl: photo.src.original || photo.src.large,
    pageUrl: photo.url,
  };
}

export function mapVideoToUiItem(video: Video): AppMediaItem {
  return {
    id: video.id,
    type: 'video',
    title: video.photographer,
    alt: video.photographer || `Video ${video.id}`,
    previewUrl: pickVideoPreview(video),
    width: video.width,
    height: video.height,
    duration: video.duration,
    photographer: video.photographer,
    downloadUrl: pickVideoPreview(video),
    pageUrl: video.url,
  };
}

export function mapPhotos(photos: Photo[]): AppMediaItem[] {
  return photos.map(mapPhotoToUiItem);
}

export function mapVideos(videos: Video[]): AppMediaItem[] {
  return videos.map(mapVideoToUiItem);
}
