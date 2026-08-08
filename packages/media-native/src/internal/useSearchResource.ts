import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaError, PageResult } from '@mediaforge/core';
import type { QueryStatus, SearchResultState } from '../types.js';
import { toMediaError } from './toMediaError.js';
import { stableSerialize } from './stableSerialize.js';

interface UseSearchResourceOptions<TItem, TParams extends { page?: number; perPage?: number }> {
  params: TParams | null;
  defaultPerPage?: number;
  fetcher: (params: TParams & { page: number; perPage: number }) => Promise<PageResult<TItem>>;
}

function getFilterKey<TParams extends { page?: number; perPage?: number }>(
  params: TParams | null,
): string | null {
  if (!params) {
    return null;
  }
  const { page: _page, ...rest } = params;
  return stableSerialize(rest);
}

export function useSearchResource<TItem, TParams extends { page?: number; perPage?: number }>(
  options: UseSearchResourceOptions<TItem, TParams>,
): SearchResultState<TItem> {
  const { params, fetcher, defaultPerPage = 15 } = options;
  const enabled = params !== null;
  const filterKey = getFilterKey(params);

  const [page, setPage] = useState(() => params?.page ?? 1);
  const [data, setData] = useState<PageResult<TItem> | null>(null);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [error, setError] = useState<MediaError | null>(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  const paramsRef = useRef(params);
  const committedFilterKeyRef = useRef<string | null>(filterKey);
  const pendingNextRef = useRef(false);
  const syncedExternalPageRef = useRef<number | undefined>(params?.page);

  fetcherRef.current = fetcher;
  paramsRef.current = params;

  const perPage = params?.perPage ?? defaultPerPage;

  let pageForFetch = page;
  if (enabled && filterKey !== committedFilterKeyRef.current) {
    pageForFetch = params?.page ?? 1;
  }

  useEffect(() => {
    if (!enabled || !params) {
      committedFilterKeyRef.current = null;
      syncedExternalPageRef.current = undefined;
      if (page !== 1) {
        setPage(1);
      }
      return;
    }

    if (committedFilterKeyRef.current !== filterKey) {
      committedFilterKeyRef.current = filterKey;
      pendingNextRef.current = false;
      setIsFetchingNextPage(false);
      const next = params.page ?? 1;
      syncedExternalPageRef.current = params.page;
      if (page !== next) {
        setPage(next);
      }
      return;
    }

    if (
      params.page !== undefined &&
      params.page !== syncedExternalPageRef.current &&
      params.page !== page
    ) {
      syncedExternalPageRef.current = params.page;
      pendingNextRef.current = false;
      setIsFetchingNextPage(false);
      setPage(params.page);
    }
  }, [enabled, filterKey, params, page]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setData(null);
      setError(null);
      setStatus('idle');
      setIsFetchingNextPage(false);
      return () => {
        requestIdRef.current += 1;
      };
    }

    const currentParams = paramsRef.current;
    if (!currentParams) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const asNextPage = pendingNextRef.current;
    pendingNextRef.current = false;
    const targetPage = pageForFetch;

    setStatus('loading');
    setError(null);
    setIsFetchingNextPage(asNextPage);

    void (async () => {
      try {
        const result = await fetcherRef.current({
          ...currentParams,
          page: targetPage,
          perPage: currentParams.perPage ?? defaultPerPage,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setData(result);
        setStatus('success');
        setIsFetchingNextPage(false);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError(toMediaError(err));
        setStatus('error');
        setIsFetchingNextPage(false);
      }
    })();

    return () => {
      requestIdRef.current += 1;
    };
  }, [defaultPerPage, enabled, filterKey, pageForFetch]);

  const refetch = useCallback(async () => {
    const currentParams = paramsRef.current;
    if (!currentParams) {
      return;
    }

    const requestId = ++requestIdRef.current;
    pendingNextRef.current = false;
    setStatus('loading');
    setError(null);
    setIsFetchingNextPage(false);

    try {
      const result = await fetcherRef.current({
        ...currentParams,
        page,
        perPage: currentParams.perPage ?? defaultPerPage,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(result);
      setStatus('success');
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(toMediaError(err));
      setStatus('error');
    }
  }, [defaultPerPage, page]);

  const hasNextPage = Boolean(data?.pageInfo.nextPage);
  const hasPrevPage = Boolean(data?.pageInfo.prevPage);

  const nextPage = useCallback(async () => {
    if (!enabled || status === 'loading' || !hasNextPage) {
      return;
    }
    const next = data?.pageInfo.nextPage;
    if (next == null) {
      return;
    }
    pendingNextRef.current = true;
    setPage(next);
  }, [data?.pageInfo.nextPage, enabled, hasNextPage, status]);

  const prevPage = useCallback(async () => {
    if (!enabled || status === 'loading' || !hasPrevPage) {
      return;
    }
    const prev = data?.pageInfo.prevPage;
    if (prev == null) {
      return;
    }
    pendingNextRef.current = false;
    setPage(prev);
  }, [data?.pageInfo.prevPage, enabled, hasPrevPage, status]);

  if (!enabled) {
    return {
      data: null,
      status: 'idle',
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      refetch,
      page: 1,
      perPage: defaultPerPage,
      hasNextPage: false,
      hasPrevPage: false,
      isFetchingNextPage: false,
      nextPage,
      prevPage,
    };
  }

  return {
    data,
    status,
    error,
    isLoading: status === 'loading' && !isFetchingNextPage,
    isError: status === 'error',
    isSuccess: status === 'success',
    refetch,
    page: pageForFetch,
    perPage,
    hasNextPage,
    hasPrevPage,
    isFetchingNextPage: status === 'loading' && isFetchingNextPage,
    nextPage,
    prevPage,
  };
}
