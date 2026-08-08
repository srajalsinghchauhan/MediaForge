import type { SearchParams, Video } from '@mediaforge/core';
import { useMediaClient } from './useMediaClient.js';
import { useSearchResource } from './internal/useSearchResource.js';
import type { SearchResultState } from './types.js';

export function useSearchVideos(
  params: SearchParams | null,
): SearchResultState<Video> {
  const client = useMediaClient();

  return useSearchResource<Video, SearchParams>({
    params,
    fetcher: (next) => client.searchVideos(next),
  });
}
