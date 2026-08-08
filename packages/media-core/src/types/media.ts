export type MediaType = 'photo' | 'video';

export interface MediaBase {
  id: number | string;
  type: MediaType;
  width: number;
  height: number;
  url: string;
  alt?: string;
  photographer?: string;
  photographerUrl?: string;
  avgColor?: string;
}

export interface Photo extends MediaBase {
  type: 'photo';
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
}

export interface VideoFile {
  id: number | string;
  quality: string;
  fileType: string;
  width: number;
  height: number;
  link: string;
}

export interface VideoPicture {
  id: number | string;
  nr: number;
  picture: string;
}

export interface Video extends MediaBase {
  type: 'video';
  duration: number;
  image: string;
  videoFiles: VideoFile[];
  videoPictures: VideoPicture[];
}

export type Media = Photo | Video;
