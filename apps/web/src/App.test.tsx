import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { App } from './App';

const trackView = vi.fn();
const trackDownload = vi.fn();
const nextPage = vi.fn(async () => undefined);

vi.mock('@mediaforge/react', () => ({
  MediaProvider: ({ children }: { children: ReactNode }) => children,
  useMediaEvents: () => ({
    trackView,
    trackDownload,
    subscribe: () => () => undefined,
  }),
  useSearchPhotos: vi.fn(),
  useSearchVideos: vi.fn(),
}));

vi.mock('@mediaforge/ui-react', async () => {
  const actual = await vi.importActual<typeof import('@mediaforge/ui-react')>(
    '@mediaforge/ui-react',
  );
  return actual;
});

import { useSearchPhotos, useSearchVideos } from '@mediaforge/react';

const idleResult = {
  data: null,
  status: 'idle' as const,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  refetch: vi.fn(async () => undefined),
  page: 1,
  perPage: 15,
  hasNextPage: false,
  hasPrevPage: false,
  isFetchingNextPage: false,
  nextPage,
  prevPage: vi.fn(async () => undefined),
};

const photoResult = {
  data: {
    items: [
      {
        id: 1,
        type: 'photo' as const,
        width: 100,
        height: 100,
        url: 'https://example.com/p',
        alt: 'Mountain',
        photographer: 'Ada',
        src: {
          original: 'https://example.com/o.jpg',
          large: 'https://example.com/l.jpg',
          medium: 'https://example.com/m.jpg',
          small: 'https://example.com/s.jpg',
          thumbnail: 'https://example.com/t.jpg',
        },
      },
    ],
    pageInfo: {
      page: 1,
      perPage: 15,
      totalResults: 1,
      nextPage: null,
      prevPage: null,
    },
  },
  status: 'success' as const,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
  refetch: vi.fn(async () => undefined),
  page: 1,
  perPage: 15,
  hasNextPage: false,
  hasPrevPage: false,
  isFetchingNextPage: false,
  nextPage,
  prevPage: vi.fn(async () => undefined),
};

const emptyResult = {
  ...photoResult,
  data: {
    items: [],
    pageInfo: {
      page: 1,
      perPage: 15,
      totalResults: 0,
      nextPage: null,
      prevPage: null,
    },
  },
};

const loadingResult = {
  ...idleResult,
  status: 'loading' as const,
  isLoading: true,
};

const errorResult = {
  ...idleResult,
  status: 'error' as const,
  isError: true,
  error: { code: 'UNAUTHORIZED', message: 'bad key', name: 'MediaError' },
};

const videoResult = {
  data: {
    items: [
      {
        id: 9,
        type: 'video' as const,
        width: 720,
        height: 1280,
        url: 'https://example.com/v',
        image: 'https://example.com/poster.jpg',
        duration: 12,
        photographer: 'Grace',
        videoFiles: [
          {
            id: 1,
            quality: 'hd' as const,
            fileType: 'video/mp4',
            width: 720,
            height: 1280,
            link: 'https://example.com/clip.mp4',
          },
        ],
        videoPictures: [],
      },
    ],
    pageInfo: {
      page: 1,
      perPage: 12,
      totalResults: 1,
      nextPage: null,
      prevPage: null,
    },
  },
  status: 'success' as const,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
  refetch: vi.fn(async () => undefined),
  page: 1,
  perPage: 12,
  hasNextPage: false,
  hasPrevPage: false,
  isFetchingNextPage: false,
  nextPage,
  prevPage: vi.fn(async () => undefined),
};

const pagedPhotos = {
  ...photoResult,
  hasNextPage: true,
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_PEXELS_API_KEY', 'test-key');
    vi.mocked(useSearchPhotos).mockReturnValue(photoResult);
    vi.mocked(useSearchVideos).mockReturnValue(emptyResult);
  });

  it('shows configuration guidance when the API key is missing', () => {
    vi.stubEnv('VITE_PEXELS_API_KEY', '');
    render(<App />);
    expect(screen.getByText(/API key required/i)).toBeTruthy();
  });

  it('renders search controls and photo results', async () => {
    render(<App />);
    expect(screen.getByLabelText(/search media/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /photos/i })).toBeTruthy();
    expect(await screen.findByAltText('Mountain')).toBeTruthy();
  });

  it('submits search from the search bar', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/search media/i);
    await user.clear(input);
    await user.type(input, 'ocean');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    expect(useSearchPhotos).toHaveBeenCalled();
  });

  it('shows a loading state', () => {
    vi.mocked(useSearchPhotos).mockReturnValue(loadingResult);
    render(<App />);
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it('shows an empty state', () => {
    vi.mocked(useSearchPhotos).mockReturnValue(emptyResult);
    render(<App />);
    expect(screen.getByText(/No results found/i)).toBeTruthy();
  });

  it('shows a friendly error state', () => {
    vi.mocked(useSearchPhotos).mockReturnValue(errorResult as never);
    render(<App />);
    expect(screen.getByText(/Authentication failed/i)).toBeTruthy();
  });

  it('opens the lightbox and tracks a view on selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByAltText('Mountain'));
    expect(trackView).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaId: 1,
        mediaType: 'photo',
        source: 'grid',
      }),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes the lightbox', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByAltText('Mountain'));
    await user.click(screen.getByRole('button', { name: /close lightbox/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('tracks download from the lightbox action', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<App />);

    await user.click(await screen.findByAltText('Mountain'));
    await user.click(screen.getByRole('button', { name: /^download$/i }));

    expect(trackDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaId: 1,
        mediaType: 'photo',
        source: 'lightbox',
      }),
    );
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('switches to video mode and opens reels', async () => {
    const user = userEvent.setup();
    vi.mocked(useSearchVideos).mockReturnValue(videoResult);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^videos$/i }));
    expect(await screen.findByRole('button', { name: /open reels/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /open reels/i }));
    expect(screen.getByRole('heading', { name: /reels/i })).toBeTruthy();
    expect(document.querySelector('video.reel-video')).toBeTruthy();
    expect(trackView).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaId: 9,
        mediaType: 'video',
        source: 'reel',
      }),
    );
  });

  it('invokes loadMore when Load more is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useSearchPhotos).mockReturnValue(pagedPhotos);
    render(<App />);
    await screen.findByAltText('Mountain');
    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(nextPage).toHaveBeenCalled();
  });
});
