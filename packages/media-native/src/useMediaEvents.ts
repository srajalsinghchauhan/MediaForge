import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  MediaDownloadPayload,
  MediaEventListener,
  MediaEventType,
  MediaViewPayload,
} from '@mediaforge/core';
import { useMediaClient } from './useMediaClient.js';

export interface MediaEventActions {
  trackView(payload: MediaViewPayload): void;
  trackDownload(payload: MediaDownloadPayload): void;
  subscribe(
    type: MediaEventType,
    listener: MediaEventListener,
  ): () => void;
}

export function useMediaEvents(): MediaEventActions {
  const client = useMediaClient();
  const subscriptionsRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    return () => {
      for (const unsubscribe of subscriptionsRef.current) {
        unsubscribe();
      }
      subscriptionsRef.current.clear();
    };
  }, []);

  const trackView = useCallback(
    (payload: MediaViewPayload) => {
      client.trackView(payload);
    },
    [client],
  );

  const trackDownload = useCallback(
    (payload: MediaDownloadPayload) => {
      client.trackDownload(payload);
    },
    [client],
  );

  const subscribe = useCallback(
    (type: MediaEventType, listener: MediaEventListener) => {
      const unsubscribe = client.on(type, listener);
      subscriptionsRef.current.add(unsubscribe);

      return () => {
        unsubscribe();
        subscriptionsRef.current.delete(unsubscribe);
      };
    },
    [client],
  );

  return useMemo(
    () => ({
      trackView,
      trackDownload,
      subscribe,
    }),
    [trackView, trackDownload, subscribe],
  );
}
