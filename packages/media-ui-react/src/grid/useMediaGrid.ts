import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { GridState, UiMediaItem } from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';
import type { WebButtonProps, WebElementProps } from '../utils/domProps.js';

export interface UseMediaGridResult<T extends UiMediaItem> {
  getGridProps: (userProps?: WebElementProps) => WebElementProps;
  getItemProps: (
    item: T,
    index: number,
    userProps?: WebElementProps,
  ) => WebElementProps;
  getLoadMoreProps: (userProps?: WebButtonProps) => WebButtonProps;
  getInfiniteScrollSentinelProps: (
    userProps?: WebElementProps,
  ) => WebElementProps;
}

export function useMediaGrid<T extends UiMediaItem>(
  state: GridState<T>,
): UseMediaGridResult<T> {
  const { items, isLoadingMore, hasNextPage, loadMore, onSelect } = state;
  const loadMoreRef = useRef(loadMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const hasNextPageRef = useRef(hasNextPage);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  loadMoreRef.current = loadMore;
  isLoadingMoreRef.current = isLoadingMore;
  hasNextPageRef.current = hasNextPage;

  const tryLoadMore = useCallback(() => {
    if (!hasNextPageRef.current || isLoadingMoreRef.current) {
      return;
    }
    loadMoreRef.current();
  }, []);

  const ensureObserver = useCallback(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            tryLoadMore();
          }
        },
        { root: null, threshold: 0 },
      );
    }

    return observerRef.current;
  }, [tryLoadMore]);

  useEffect(() => {
    const observer = ensureObserver();
    const node = sentinelNodeRef.current;
    if (!observer || !node) {
      return;
    }

    observer.disconnect();
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [ensureObserver, items.length, hasNextPage, isLoadingMore]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const setSentinelRef = useCallback(
    (node: HTMLElement | null) => {
      sentinelNodeRef.current = node;
      const observer = ensureObserver();
      observer?.disconnect();
      if (node && observer) {
        observer.observe(node);
      }
    },
    [ensureObserver],
  );

  const getGridProps = useCallback(
    (userProps?: WebElementProps) =>
      mergeProps<WebElementProps>(
        {
          role: 'group',
          'data-media-grid': '',
        },
        userProps,
      ),
    [],
  );

  const getItemProps = useCallback(
    (item: T, index: number, userProps?: WebElementProps) => {
      const label = item.alt ?? item.title ?? `Media item ${index + 1}`;

      return mergeProps<WebElementProps>(
        {
          tabIndex: 0,
          'aria-label': label,
          'data-media-grid-item': String(index),
          onClick: () => {
            onSelect?.(item, index);
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect?.(item, index);
              return;
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault();
              focusSibling(event.currentTarget, 1);
              return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault();
              focusSibling(event.currentTarget, -1);
            }
          },
        },
        userProps,
      );
    },
    [onSelect],
  );

  const getLoadMoreProps = useCallback(
    (userProps?: WebButtonProps) =>
      mergeProps<WebButtonProps>(
        {
          type: 'button',
          disabled: !hasNextPage || isLoadingMore,
          'aria-disabled': !hasNextPage || isLoadingMore,
          onClick: () => {
            tryLoadMore();
          },
        },
        userProps,
      ),
    [hasNextPage, isLoadingMore, tryLoadMore],
  );

  const getInfiniteScrollSentinelProps = useCallback(
    (userProps?: WebElementProps) =>
      mergeProps<WebElementProps>(
        {
          'aria-hidden': true,
          'data-media-grid-sentinel': '',
          ref: setSentinelRef,
        },
        userProps,
      ),
    [setSentinelRef],
  );

  return {
    getGridProps,
    getItemProps,
    getLoadMoreProps,
    getInfiniteScrollSentinelProps,
  };
}

function focusSibling(current: HTMLElement, delta: number): void {
  const root = current.closest('[data-media-grid]');
  if (!root) {
    return;
  }

  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[data-media-grid-item]'),
  );
  const index = items.indexOf(current);
  if (index < 0) {
    return;
  }

  const next = items[index + delta];
  next?.focus();
}
