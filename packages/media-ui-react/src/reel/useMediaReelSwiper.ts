import { useCallback, useEffect, useRef } from 'react';
import type { ReelSwiperState, UiMediaItem } from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';
import type { WebElementProps } from '../utils/domProps.js';

export interface UseMediaReelSwiperResult<T extends UiMediaItem> {
  getContainerProps: (userProps?: WebElementProps) => WebElementProps;
  getSlideProps: (
    item: T,
    index: number,
    userProps?: WebElementProps,
  ) => WebElementProps;
}

export function useMediaReelSwiper<T extends UiMediaItem>(
  state: ReelSwiperState<T>,
): UseMediaReelSwiperResult<T> {
  const { items, activeIndex, onActiveChange } = state;
  const containerRef = useRef<HTMLElement | null>(null);
  const slideRefs = useRef(new Map<number, HTMLElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const onActiveChangeRef = useRef(onActiveChange);
  const itemsRef = useRef(items);

  activeIndexRef.current = activeIndex;
  onActiveChangeRef.current = onActiveChange;
  itemsRef.current = items;

  const syncObserver = useCallback(() => {
    observerRef.current?.disconnect();

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const root = containerRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const indexAttr = (visible.target as HTMLElement).dataset.mediaReelIndex;
        if (indexAttr === undefined) {
          return;
        }

        const nextIndex = Number(indexAttr);
        if (Number.isNaN(nextIndex) || nextIndex === activeIndexRef.current) {
          return;
        }

        const item = itemsRef.current[nextIndex];
        if (!item) {
          return;
        }

        activeIndexRef.current = nextIndex;
        onActiveChangeRef.current(item, nextIndex);
      },
      {
        root,
        threshold: [0.6],
      },
    );

    for (const node of slideRefs.current.values()) {
      observerRef.current.observe(node);
    }
  }, []);

  useEffect(() => {
    syncObserver();
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [syncObserver, items.length]);

  useEffect(() => {
    const node = slideRefs.current.get(activeIndex);
    if (!node || !containerRef.current) {
      return;
    }

    if (typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'start', inline: 'nearest' });
    }
  }, [activeIndex]);

  const setContainerRef = useCallback(
    (node: HTMLElement | null) => {
      containerRef.current = node;
      syncObserver();
    },
    [syncObserver],
  );

  const getContainerProps = useCallback(
    (userProps?: WebElementProps) =>
      mergeProps<WebElementProps>(
        {
          role: 'list',
          'aria-orientation': 'vertical',
          'data-media-reel': '',
          tabIndex: 0,
          ref: setContainerRef,
          onKeyDown: (event) => {
            if (event.key === 'ArrowDown' || event.key === 'PageDown') {
              event.preventDefault();
              const next = Math.min(
                activeIndexRef.current + 1,
                itemsRef.current.length - 1,
              );
              const item = itemsRef.current[next];
              if (item && next !== activeIndexRef.current) {
                onActiveChangeRef.current(item, next);
              }
              return;
            }

            if (event.key === 'ArrowUp' || event.key === 'PageUp') {
              event.preventDefault();
              const prev = Math.max(activeIndexRef.current - 1, 0);
              const item = itemsRef.current[prev];
              if (item && prev !== activeIndexRef.current) {
                onActiveChangeRef.current(item, prev);
              }
            }
          },
        },
        userProps,
      ),
    [setContainerRef],
  );

  const getSlideProps = useCallback(
    (item: T, index: number, userProps?: WebElementProps) => {
      const isActive = index === activeIndex;

      return mergeProps<WebElementProps>(
        {
          role: 'listitem',
          'aria-hidden': !isActive,
          tabIndex: isActive ? 0 : -1,
          'data-media-reel-index': String(index),
          'data-active': isActive ? 'true' : 'false',
          'aria-label': item.alt ?? item.title ?? `Reel slide ${index + 1}`,
          ref: (node: HTMLElement | null) => {
            if (node) {
              slideRefs.current.set(index, node);
            } else {
              slideRefs.current.delete(index);
            }
            syncObserver();
          },
        },
        userProps,
      );
    },
    [activeIndex, syncObserver],
  );

  return {
    getContainerProps,
    getSlideProps,
  };
}
