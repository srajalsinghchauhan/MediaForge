import { useEffect, useMemo, useState } from 'react';
import {
  useMediaEvents,
  useSearchPhotos,
  useSearchVideos,
} from '@mediaforge/react';
import { ModeToggle, type SearchMode } from './ModeToggle';
import { SearchBar } from './SearchBar';
import { MediaGridView } from './MediaGridView';
import { MediaLightboxView } from './MediaLightboxView';
import { ReelView } from './ReelView';
import {
  mapPhotos,
  mapVideos,
  type AppMediaItem,
} from '../lib/mapMedia';

export function MediaExplorer() {
  const [mode, setMode] = useState<SearchMode>('photos');
  const [draft, setDraft] = useState('nature');
  const [query, setQuery] = useState('nature');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [photoItems, setPhotoItems] = useState<AppMediaItem[]>([]);
  const [videoItems, setVideoItems] = useState<AppMediaItem[]>([]);

  const { trackView, trackDownload } = useMediaEvents();

  const photoSearch = useSearchPhotos(
    mode === 'photos' && query.trim() ? { query: query.trim(), perPage: 15 } : null,
  );
  const videoSearch = useSearchVideos(
    mode === 'videos' && query.trim() ? { query: query.trim(), perPage: 12 } : null,
  );

  const activeSearch = mode === 'photos' ? photoSearch : videoSearch;

  useEffect(() => {
    if (
      mode !== 'photos' ||
      !photoSearch.data ||
      photoSearch.isLoading ||
      photoSearch.isFetchingNextPage
    ) {
      return;
    }

    const mapped = mapPhotos(photoSearch.data.items);
    setPhotoItems((prev) =>
      photoSearch.page <= 1 ? mapped : mergeUnique(prev, mapped),
    );
  }, [
    mode,
    photoSearch.data,
    photoSearch.isFetchingNextPage,
    photoSearch.isLoading,
    photoSearch.page,
  ]);

  useEffect(() => {
    if (
      mode !== 'videos' ||
      !videoSearch.data ||
      videoSearch.isLoading ||
      videoSearch.isFetchingNextPage
    ) {
      return;
    }

    const mapped = mapVideos(videoSearch.data.items);
    setVideoItems((prev) =>
      videoSearch.page <= 1 ? mapped : mergeUnique(prev, mapped),
    );
  }, [
    mode,
    videoSearch.data,
    videoSearch.isFetchingNextPage,
    videoSearch.isLoading,
    videoSearch.page,
  ]);

  const items = mode === 'photos' ? photoItems : videoItems;

  const statusMessage = useMemo(() => {
    if (!query.trim()) {
      return 'Enter a search term to browse Pexels media.';
    }
    if (activeSearch.isLoading && items.length === 0) {
      return 'Loading…';
    }
    if (activeSearch.isError) {
      return formatError(activeSearch.error?.code);
    }
    if (activeSearch.isSuccess && items.length === 0) {
      return 'No results found.';
    }
    return null;
  }, [
    activeSearch.error?.code,
    activeSearch.isError,
    activeSearch.isLoading,
    activeSearch.isSuccess,
    items.length,
    query,
  ]);

  function resetResults() {
    setPhotoItems([]);
    setVideoItems([]);
    setLightboxOpen(false);
    setReelsOpen(false);
    setLightboxIndex(0);
    setReelIndex(0);
  }

  function handleSearch() {
    const next = draft.trim();
    if (!next) {
      return;
    }
    resetResults();
    setQuery(next);
  }

  function handleModeChange(nextMode: SearchMode) {
    resetResults();
    setMode(nextMode);
  }

  function handleSelect(item: AppMediaItem, index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
    trackView({
      mediaId: item.id,
      mediaType: item.type,
      source: 'grid',
      query,
      page: activeSearch.page,
    });
  }

  function handleDownload(item: AppMediaItem) {
    trackDownload({
      mediaId: item.id,
      mediaType: item.type,
      source: 'lightbox',
    });

    const url = item.downloadUrl || item.previewUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleReelActive(item: AppMediaItem, index: number) {
    setReelIndex(index);
    trackView({
      mediaId: item.id,
      mediaType: 'video',
      source: 'reel',
      query,
      page: index + 1,
    });
  }

  if (reelsOpen && mode === 'videos') {
    return (
      <ReelView
        items={videoItems}
        activeIndex={reelIndex}
        onActiveChange={handleReelActive}
        onClose={() => setReelsOpen(false)}
      />
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">MediaForge</p>
          <h1>Headless media browsing</h1>
          <p className="lede">
            Search Pexels through <code>@mediaforge/react</code>, render with{' '}
            <code>@mediaforge/ui-react</code>.
          </p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </header>

      <SearchBar
        value={draft}
        onChange={setDraft}
        onSubmit={handleSearch}
        isLoading={activeSearch.isLoading && items.length === 0}
      />

      <div className="toolbar">
        <p className="muted">
          {items.length > 0
            ? `${items.length} ${mode} loaded`
            : 'Ready to search'}
        </p>
        {mode === 'videos' && videoItems.length > 0 ? (
          <button
            type="button"
            className="button"
            onClick={() => {
              setReelIndex(0);
              setReelsOpen(true);
              const first = videoItems[0];
              if (first) {
                trackView({
                  mediaId: first.id,
                  mediaType: 'video',
                  source: 'reel',
                  query,
                  page: 1,
                });
              }
            }}
          >
            Open Reels
          </button>
        ) : null}
      </div>

      {statusMessage ? <p className="status">{statusMessage}</p> : null}

      {items.length > 0 ? (
        <MediaGridView
          items={items}
          isLoading={activeSearch.isLoading && items.length === 0}
          isLoadingMore={activeSearch.isFetchingNextPage}
          hasNextPage={activeSearch.hasNextPage}
          loadMore={() => {
            void activeSearch.nextPage();
          }}
          onSelect={handleSelect}
        />
      ) : null}

      <MediaLightboxView
        open={lightboxOpen}
        items={items}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        onDownload={handleDownload}
      />
    </main>
  );
}

function mergeUnique(existing: AppMediaItem[], incoming: AppMediaItem[]) {
  const seen = new Set(existing.map((item) => `${item.type}:${item.id}`));
  const next = [...existing];
  for (const item of incoming) {
    const key = `${item.type}:${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(item);
    }
  }
  return next;
}

function formatError(code?: string) {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Authentication failed. Check your Pexels API key configuration.';
    case 'RATE_LIMITED':
      return 'Rate limited by Pexels. Try again shortly.';
    case 'NETWORK':
      return 'Network error. Check your connection and retry.';
    case 'BAD_REQUEST':
      return 'Invalid search request.';
    default:
      return 'Unable to load media right now.';
  }
}
