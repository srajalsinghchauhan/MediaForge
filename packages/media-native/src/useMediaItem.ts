import { useCallback } from 'react';
import {
  isMediaError,
  type Media,
  type MediaClient,
  type MediaItemParams,
} from '@mediaforge/core';
import { useMediaClient } from './useMediaClient.js';
import { useAsyncResource } from './internal/useAsyncResource.js';
import { stableSerialize } from './internal/stableSerialize.js';
import type { AsyncState } from './types.js';

async function resolveMediaItem(
  client: MediaClient,
  id: number | string,
): Promise<Media> {
  try {
    return await client.getPhoto(id);
  } catch (error) {
    if (isMediaError(error) && error.code === 'NOT_FOUND') {
      return client.getVideo(id);
    }
    throw error;
  }
}

export function useMediaItem(
  params: MediaItemParams | null,
): AsyncState<Media> {
  const client = useMediaClient();
  const enabled = params !== null;
  const key = params ? stableSerialize(params) : null;

  const fetcher = useCallback(() => {
    if (!params) {
      return Promise.reject(new Error('Media item query is disabled'));
    }
    return resolveMediaItem(client, params.id);
  }, [client, params]);

  return useAsyncResource<Media>({
    enabled,
    key,
    fetcher,
  });
}
