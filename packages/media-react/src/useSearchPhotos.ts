import type { Photo, SearchParams } from '@mediaforge/core';
import { useMediaClient } from './useMediaClient.js';
import { useSearchResource } from './internal/useSearchResource.js';
import type { SearchResultState } from './types.js';

export function useSearchPhotos(
  params: SearchParams | null,
): SearchResultState<Photo> {
  const client = useMediaClient();

  return useSearchResource<Photo, SearchParams>({
    params,
    fetcher: (next) => client.searchPhotos(next),
  });
}
