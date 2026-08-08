import { useCallback, useRef } from 'react';
import type {
  GridState,
  NativeListAdapterProps,
  NativePressableProps,
  NativeViewProps,
  UiMediaItem,
} from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';

export interface UseMediaGridResult<T extends UiMediaItem> {
  getGridProps: (userProps?: NativeViewProps) => NativeViewProps;
  getItemProps: (
    item: T,
    index: number,
    userProps?: NativePressableProps,
  ) => NativePressableProps;
  getLoadMoreProps: (userProps?: NativePressableProps) => NativePressableProps;
  getListAdapterProps: (
    userProps?: NativeListAdapterProps,
  ) => NativeListAdapterProps;
  onEndReached: () => void;
}

export function useMediaGrid<T extends UiMediaItem>(
  state: GridState<T>,
): UseMediaGridResult<T> {
  const { isLoadingMore, hasNextPage, loadMore, onSelect } = state;
  const loadMoreRef = useRef(loadMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const hasNextPageRef = useRef(hasNextPage);

  loadMoreRef.current = loadMore;
  isLoadingMoreRef.current = isLoadingMore;
  hasNextPageRef.current = hasNextPage;

  const tryLoadMore = useCallback(() => {
    if (!hasNextPageRef.current || isLoadingMoreRef.current) {
      return;
    }
    loadMoreRef.current();
  }, []);

  const getGridProps = useCallback(
    (userProps?: NativeViewProps) =>
      mergeProps<NativeViewProps>(
        {
          accessibilityRole: 'list',
          accessible: true,
        },
        userProps,
      ),
    [],
  );

  const getItemProps = useCallback(
    (item: T, index: number, userProps?: NativePressableProps) => {
      const label = item.alt ?? item.title ?? `Media item ${index + 1}`;

      return mergeProps<NativePressableProps>(
        {
          accessibilityRole: 'button',
          accessibilityLabel: label,
          accessible: true,
          onPress: () => {
            onSelect?.(item, index);
          },
        },
        userProps,
      );
    },
    [onSelect],
  );

  const getLoadMoreProps = useCallback(
    (userProps?: NativePressableProps) =>
      mergeProps<NativePressableProps>(
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Load more media',
          disabled: !hasNextPage || isLoadingMore,
          accessibilityState: { disabled: !hasNextPage || isLoadingMore },
          onPress: () => {
            tryLoadMore();
          },
        },
        userProps,
      ),
    [hasNextPage, isLoadingMore, tryLoadMore],
  );

  const getListAdapterProps = useCallback(
    (userProps?: NativeListAdapterProps) =>
      mergeProps<NativeListAdapterProps>(
        {
          onEndReached: () => {
            tryLoadMore();
          },
          onEndReachedThreshold: 0.2,
        },
        userProps,
      ),
    [tryLoadMore],
  );

  return {
    getGridProps,
    getItemProps,
    getLoadMoreProps,
    getListAdapterProps,
    onEndReached: tryLoadMore,
  };
}
