import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaError } from '@mediaforge/core';
import type { AsyncState, QueryStatus } from '../types.js';
import { toMediaError } from './toMediaError.js';

interface UseAsyncResourceOptions<T> {
  enabled: boolean;
  key: string | null;
  fetcher: () => Promise<T>;
}

export function useAsyncResource<T>(
  options: UseAsyncResourceOptions<T>,
): AsyncState<T> {
  const { enabled, key, fetcher } = options;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [error, setError] = useState<MediaError | null>(null);
  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    if (!enabled || key === null) {
      requestIdRef.current += 1;
      setData(null);
      setError(null);
      setStatus('idle');
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await fetcherRef.current();
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
  }, [enabled, key]);

  useEffect(() => {
    void run();
    return () => {
      requestIdRef.current += 1;
    };
  }, [run]);

  const refetch = useCallback(async () => {
    await run();
  }, [run]);

  return {
    data: enabled ? data : null,
    status: enabled ? status : 'idle',
    error: enabled ? error : null,
    isLoading: enabled && status === 'loading',
    isError: enabled && status === 'error',
    isSuccess: enabled && status === 'success',
    refetch,
  };
}
