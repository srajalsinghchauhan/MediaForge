import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MediaProvider, useMediaItem } from '../src/index.js';
import {
  createFakeClient,
  createNotFoundError,
  createPhoto,
  createVideo,
} from './helpers.js';

function createWrapper(client: ReturnType<typeof createFakeClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MediaProvider client={client}>{children}</MediaProvider>;
  };
}

describe('useMediaItem', () => {
  it('returns a photo when getPhoto succeeds', async () => {
    const client = createFakeClient({
      getPhoto: vi.fn(async () => createPhoto(15)),
    });

    const { result } = renderHook(() => useMediaItem({ id: 15 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('photo');
    expect(client.getVideo).not.toHaveBeenCalled();
  });

  it('falls back to getVideo when photo is not found', async () => {
    const client = createFakeClient({
      getPhoto: vi.fn(async () => {
        throw createNotFoundError();
      }),
      getVideo: vi.fn(async () => createVideo(22)),
    });

    const { result } = renderHook(() => useMediaItem({ id: 22 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.type).toBe('video');
    expect(client.getPhoto).toHaveBeenCalled();
    expect(client.getVideo).toHaveBeenCalledWith(22);
  });

  it('stays idle when disabled', async () => {
    const client = createFakeClient();
    const { result } = renderHook(() => useMediaItem(null), {
      wrapper: createWrapper(client),
    });

    expect(result.current.status).toBe('idle');
    expect(client.getPhoto).not.toHaveBeenCalled();
    expect(client.getVideo).not.toHaveBeenCalled();
  });
});
