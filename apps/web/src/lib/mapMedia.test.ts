import { describe, expect, it } from 'vitest';
import type { Photo, Video } from '@mediaforge/react';
import { mapPhotoToUiItem, mapVideoToUiItem } from './mapMedia';

describe('mapMedia', () => {
  it('maps photos into UiMediaItem fields', () => {
    const photo = {
      id: 10,
      type: 'photo',
      width: 100,
      height: 120,
      url: 'https://example.com/p',
      alt: 'Forest',
      photographer: 'Ada',
      src: {
        original: 'https://example.com/o.jpg',
        large: 'https://example.com/l.jpg',
        medium: 'https://example.com/m.jpg',
        small: 'https://example.com/s.jpg',
        thumbnail: 'https://example.com/t.jpg',
      },
    } satisfies Photo;

    const item = mapPhotoToUiItem(photo);
    expect(item.type).toBe('photo');
    expect(item.previewUrl).toBe('https://example.com/m.jpg');
    expect(item.downloadUrl).toBe('https://example.com/o.jpg');
    expect(item.photographer).toBe('Ada');
  });

  it('maps videos using a playable file link', () => {
    const video = {
      id: 22,
      type: 'video',
      width: 1920,
      height: 1080,
      url: 'https://example.com/v',
      photographer: 'Lin',
      duration: 12,
      image: 'https://example.com/poster.jpg',
      videoFiles: [
        {
          id: 1,
          quality: 'hd',
          fileType: 'video/mp4',
          width: 1920,
          height: 1080,
          link: 'https://example.com/clip.mp4',
        },
      ],
      videoPictures: [],
    } satisfies Video;

    const item = mapVideoToUiItem(video);
    expect(item.type).toBe('video');
    expect(item.previewUrl).toBe('https://example.com/clip.mp4');
    expect(item.duration).toBe(12);
  });
});
