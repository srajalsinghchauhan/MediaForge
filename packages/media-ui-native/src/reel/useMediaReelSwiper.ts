import { useCallback, useRef } from 'react';
import type {
  NativeListAdapterProps,
  NativeViewProps,
  ReelSwiperState,
  UiMediaItem,
} from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';

export interface UseMediaReelSwiperResult<T extends UiMediaItem> {
  getContainerProps: (userProps?: NativeViewProps) => NativeViewProps;
  getSlideProps: (
    item: T,
    index: number,
    userProps?: NativeViewProps,
  ) => NativeViewProps & { 'data-active'?: string };
  getListAdapterProps: (
    userProps?: NativeListAdapterProps,
  ) => NativeListAdapterProps;
}

export function useMediaReelSwiper<T extends UiMediaItem>(
  state: ReelSwiperState<T>,
): UseMediaReelSwiperResult<T> {
  const { items, activeIndex, onActiveChange } = state;
  const activeIndexRef = useRef(activeIndex);
  const onActiveChangeRef = useRef(onActiveChange);
  const itemsRef = useRef(items);

  activeIndexRef.current = activeIndex;
  onActiveChangeRef.current = onActiveChange;
  itemsRef.current = items;

  const getContainerProps = useCallback(
    (userProps?: NativeViewProps) =>
      mergeProps<NativeViewProps>(
        {
          accessibilityRole: 'list',
          accessible: true,
          accessibilityLabel: 'Vertical media reel',
        },
        userProps,
      ),
    [],
  );

  const getSlideProps = useCallback(
    (item: T, index: number, userProps?: NativeViewProps) => {
      const isActive = index === activeIndex;

      return mergeProps<NativeViewProps>(
        {
          accessibilityRole: 'none',
          accessible: isActive,
          importantForAccessibility: isActive ? 'yes' : 'no-hide-descendants',
          accessibilityLabel: item.alt ?? item.title ?? `Reel slide ${index + 1}`,
          'data-active': isActive ? 'true' : 'false',
        },
        userProps,
      );
    },
    [activeIndex],
  );

  const getListAdapterProps = useCallback(
    (userProps?: NativeListAdapterProps) =>
      mergeProps<NativeListAdapterProps>(
        {
          pagingEnabled: true,
          horizontal: false,
          viewabilityConfig: {
            itemVisiblePercentThreshold: 60,
          },
          onViewableItemsChanged: (info) => {
            const viewable = info.viewableItems.find(
              (entry) => entry.index != null && entry.index >= 0,
            );
            if (!viewable || viewable.index == null) {
              return;
            }

            const nextIndex = viewable.index;
            if (nextIndex === activeIndexRef.current) {
              return;
            }

            const item = itemsRef.current[nextIndex];
            if (!item) {
              return;
            }

            activeIndexRef.current = nextIndex;
            onActiveChangeRef.current(item, nextIndex);
          },
        },
        userProps,
      ),
    [],
  );

  return {
    getContainerProps,
    getSlideProps,
    getListAdapterProps,
  };
}
