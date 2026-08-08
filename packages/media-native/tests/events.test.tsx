import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { MediaProvider, useMediaEvents } from '../src/index.js';
import { createFakeClient } from './helpers.js';
import type { MediaEvent } from '@mediaforge/core';

function createWrapper(client: ReturnType<typeof createFakeClient>, strict = false) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const tree = <MediaProvider client={client}>{children}</MediaProvider>;
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
}

describe('useMediaEvents', () => {
  it('delegates trackView and trackDownload to core', () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useMediaEvents(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.trackView({ mediaId: 1, mediaType: 'photo', source: 'grid' });
      result.current.trackDownload({ mediaId: 2, mediaType: 'video', source: 'lightbox' });
    });

    expect(client.trackView).toHaveBeenCalledWith({
      mediaId: 1,
      mediaType: 'photo',
      source: 'grid',
    });
    expect(client.trackDownload).toHaveBeenCalledWith({
      mediaId: 2,
      mediaType: 'video',
      source: 'lightbox',
    });
  });

  it('subscribes and unsubscribes through core', () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useMediaEvents(), {
      wrapper: createWrapper(client),
    });

    const events: MediaEvent[] = [];
    let unsubscribe!: () => void;

    act(() => {
      unsubscribe = result.current.subscribe('view', (event) => {
        events.push(event);
      });
    });

    act(() => {
      client.trackView({ mediaId: 5, mediaType: 'photo' });
    });
    expect(events).toHaveLength(1);

    act(() => {
      unsubscribe();
      client.trackView({ mediaId: 6, mediaType: 'photo' });
    });
    expect(events).toHaveLength(1);
  });

  it('cleans up subscriptions on unmount', () => {
    const client = createFakeClient();
    const { result, unmount } = renderHook(() => useMediaEvents(), {
      wrapper: createWrapper(client),
    });

    const listener = vi.fn();
    act(() => {
      result.current.subscribe('download', listener);
    });

    unmount();

    act(() => {
      client.trackDownload({ mediaId: 9, mediaType: 'photo' });
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not duplicate subscriptions under Strict Mode remount cleanup', () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useMediaEvents(), {
      wrapper: createWrapper(client, true),
    });

    const listener = vi.fn();
    act(() => {
      result.current.subscribe('view', listener);
    });

    act(() => {
      client.trackView({ mediaId: 1, mediaType: 'photo' });
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
