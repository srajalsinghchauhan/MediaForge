export interface UiMediaItem {
  id: number | string;
  type: 'photo' | 'video';
  title?: string;
  alt?: string;
  previewUrl: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface GridState<T extends UiMediaItem> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  onSelect?: (item: T, index: number) => void;
}

export interface LightboxState<T extends UiMediaItem> {
  open: boolean;
  items: T[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  labelledBy?: string;
  label?: string;
}

export interface ReelSwiperState<T extends UiMediaItem> {
  items: T[];
  activeIndex: number;
  onActiveChange: (item: T, index: number) => void;
}
