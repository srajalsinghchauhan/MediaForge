import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MediaProvider, useSearchPhotos, useSearchVideos, useCuratedPhotos } from '../src/index.js';
import {
  createFakeClient,
  createPhoto,
  createRateLimitError,
  createVideo,
  pageResult,
} from './helpers.js';

function createWrapper(client: ReturnType<typeof createFakeClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MediaProvider client={client}>{children}</MediaProvider>;
  };
}

describe('search hooks', () => {
  it('loads search photos successfully', async () => {
    const client = createFakeClient({
      searchPhotos: vi.fn(async () => pageResult([createPhoto(11)])),
    });

    const { result } = renderHook(() => useSearchPhotos({ query: 'cats' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0]?.id).toBe(11);
    expect(client.searchPhotos).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'cats', page: 1 }),
    );
  });

  it('exposes typed errors', async () => {
    const client = createFakeClient({
      searchPhotos: vi.fn(async () => {
        throw createRateLimitError();
      }),
    });

    const { result } = renderHook(() => useSearchPhotos({ query: 'cats' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe('RATE_LIMITED');
  });

  it('supports refetch', async () => {
    const client = createFakeClient({
      searchPhotos: vi
        .fn()
        .mockResolvedValueOnce(pageResult([createPhoto(1)]))
        .mockResolvedValueOnce(pageResult([createPhoto(2)])),
    });

    const { result } = renderHook(() => useSearchPhotos({ query: 'cats' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data?.items[0]?.id).toBe(1));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.data?.items[0]?.id).toBe(2));
    expect(client.searchPhotos).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when disabled with null', async () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useSearchPhotos(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(client.searchPhotos).not.toHaveBeenCalled();
  });

  it('ignores stale responses when params change', async () => {
    let resolveFirst!: (value: ReturnType<typeof pageResult<ReturnType<typeof createPhoto>>>) => void;
    const firstPromise = new Promise<ReturnType<typeof pageResult<ReturnType<typeof createPhoto>>>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );

    const client = createFakeClient({
      searchPhotos: vi
        .fn()
        .mockImplementationOnce(async () => firstPromise)
        .mockResolvedValueOnce(pageResult([createPhoto(99)])),
    });

    const { result, rerender } = renderHook(
      ({ query }) => useSearchPhotos({ query }),
      {
        initialProps: { query: 'one' },
        wrapper: createWrapper(client),
      },
    );

    rerender({ query: 'two' });

    await waitFor(() => expect(result.current.data?.items[0]?.id).toBe(99));

    await act(async () => {
      resolveFirst(pageResult([createPhoto(1)]));
    });

    expect(result.current.data?.items[0]?.id).toBe(99);
  });

  it('paginates with nextPage and prevPage', async () => {
    const client = createFakeClient({
      searchPhotos: vi.fn(async ({ page = 1 }) => pageResult([createPhoto(page)], page, 45)),
    });

    const { result } = renderHook(() => useSearchPhotos({ query: 'cats' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(false);

    await act(async () => {
      await result.current.nextPage();
    });

    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.data?.items[0]?.id).toBe(2));
    expect(result.current.hasPrevPage).toBe(true);

    await act(async () => {
      await result.current.prevPage();
    });

    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it('does not start a duplicate nextPage while loading', async () => {
    let resolveSearch!: (value: ReturnType<typeof pageResult<ReturnType<typeof createPhoto>>>) => void;
    const pending = new Promise<ReturnType<typeof pageResult<ReturnType<typeof createPhoto>>>>(
      (resolve) => {
        resolveSearch = resolve;
      },
    );

    const client = createFakeClient({
      searchPhotos: vi.fn(async () => pending),
    });

    const { result } = renderHook(() => useSearchPhotos({ query: 'cats' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await result.current.nextPage();
    });

    expect(client.searchPhotos).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSearch(pageResult([createPhoto(1)], 1, 45));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads videos and curated photos through core', async () => {
    const client = createFakeClient({
      searchVideos: vi.fn(async () => pageResult([createVideo(7)])),
      curatedPhotos: vi.fn(async () => pageResult([createPhoto(8)])),
    });

    const videos = renderHook(() => useSearchVideos({ query: 'waves' }), {
      wrapper: createWrapper(client),
    });
    const curated = renderHook(() => useCuratedPhotos({ page: 1 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(videos.result.current.data?.items[0]?.type).toBe('video'));
    await waitFor(() => expect(curated.result.current.data?.items[0]?.id).toBe(8));
  });

  it('disables curated photos when params are null', async () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useCuratedPhotos(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.status).toBe('idle');
    expect(client.curatedPhotos).not.toHaveBeenCalled();
  });
});
