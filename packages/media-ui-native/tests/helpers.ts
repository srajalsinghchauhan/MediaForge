import { createElement, type ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
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

export function renderHook<T>(callback: () => T) {
  const result: { current: T | null } = { current: null };

  function HookHost() {
    result.current = callback();
    return null;
  }

  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(HookHost));
  });

  return {
    result: result as { current: T },
    rerender(next?: () => T) {
      act(() => {
        renderer.update(
          createElement(function HookHost() {
            result.current = (next ?? callback)();
            return null;
          }) as unknown as ReactElement,
        );
      });
    },
    unmount() {
      act(() => {
        renderer.unmount();
      });
    },
  };
}
