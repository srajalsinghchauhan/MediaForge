import type { MediaError, PageResult } from '@mediaforge/core';

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: QueryStatus;
  error: MediaError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

export interface SearchResultState<T> extends AsyncState<PageResult<T>> {
  page: number;
  perPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFetchingNextPage: boolean;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
}
