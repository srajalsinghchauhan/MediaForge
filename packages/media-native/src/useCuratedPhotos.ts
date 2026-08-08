import type { CuratedParams, Photo } from '@mediaforge/core';
import { useMediaClient } from './useMediaClient.js';
import { useSearchResource } from './internal/useSearchResource.js';
import type { SearchResultState } from './types.js';

export function useCuratedPhotos(
  params?: CuratedParams | null,
): SearchResultState<Photo> {
  const client = useMediaClient();
  const normalized = params === undefined ? {} : params;

  return useSearchResource<Photo, CuratedParams>({
    params: normalized,
    fetcher: (next) => client.curatedPhotos(next),
  });
}
