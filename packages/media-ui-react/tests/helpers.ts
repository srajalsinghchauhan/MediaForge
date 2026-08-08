import { vi } from 'vitest';
import type { UiMediaItem } from '../src/types.js';

export function createItem(
  id: number | string,
  overrides: Partial<UiMediaItem> = {},
): UiMediaItem {
  return {
    id,
    type: 'photo',
    previewUrl: `https://example.com/${id}.jpg`,
    alt: `Item ${id}`,
    ...overrides,
  };
}

export function installIntersectionObserverMock() {
  const instances: FakeIntersectionObserver[] = [];

  class FakeIntersectionObserver {
    callback: IntersectionObserverCallback;
    elements = new Set<Element>();

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }

    observe = (element: Element) => {
      this.elements.add(element);
    };

    unobserve = (element: Element) => {
      this.elements.delete(element);
    };

    disconnect = () => {
      this.elements.clear();
    };

    takeRecords = () => [];

    trigger(isIntersecting: boolean) {
      const entries = Array.from(this.elements).map(
        (target) =>
          ({
            isIntersecting,
            target,
            intersectionRatio: isIntersecting ? 1 : 0,
            time: Date.now(),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
          }) satisfies IntersectionObserverEntry,
      );
      this.callback(entries, this as unknown as IntersectionObserver);
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  return {
    instances,
    triggerAll(isIntersecting: boolean) {
      for (const instance of instances) {
        instance.trigger(isIntersecting);
      }
    },
    restore() {
      instances.length = 0;
      vi.unstubAllGlobals();
    },
  };
}
