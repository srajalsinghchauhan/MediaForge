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
  label?: string;
}

export interface ReelSwiperState<T extends UiMediaItem> {
  items: T[];
  activeIndex: number;
  onActiveChange: (item: T, index: number) => void;
}

export type NativeHandler = (...args: unknown[]) => void;

export interface NativePressableProps {
  onPress?: NativeHandler;
  disabled?: boolean;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean };
  accessible?: boolean;
  testID?: string;
  children?: unknown;
  [key: string]: unknown;
}

export interface NativeViewProps {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityViewIsModal?: boolean;
  accessible?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
  children?: unknown;
  [key: string]: unknown;
}

export interface NativeListAdapterProps {
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  onViewableItemsChanged?: (info: {
    viewableItems: Array<{ index: number | null; item: unknown }>;
  }) => void;
  viewabilityConfig?: {
    itemVisiblePercentThreshold: number;
  };
  pagingEnabled?: boolean;
  horizontal?: boolean;
}
