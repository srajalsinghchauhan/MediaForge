# API Contracts

> **Status:** Planned public TypeScript contracts. Names and shapes may be refined during implementation but should stay aligned with this document.

These contracts define the public surface for implementers of `media-core`, `media-react`, `media-native`, `media-ui-react`, and `media-ui-native`.

---

## Media model

```ts
type MediaType = 'photo' | 'video';

interface MediaBase {
  id: number | string;
  type: MediaType;
  width: number;
  height: number;
  url: string;
  alt?: string;
  photographer?: string;
  photographerUrl?: string;
  avgColor?: string;
}

interface Photo extends MediaBase {
  type: 'photo';
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
}

interface VideoFile {
  id: number | string;
  quality: string;
  fileType: string;
  width: number;
  height: number;
  link: string;
}

interface VideoPicture {
  id: number | string;
  nr: number;
  picture: string;
}

interface Video extends MediaBase {
  type: 'video';
  duration: number;
  image: string;
  videoFiles: VideoFile[];
  videoPictures: VideoPicture[];
}

type Media = Photo | Video;
```

UI packages should depend on a **minimal item shape** (see UI props), not necessarily the full Pexels-mapped `Media` type, so they stay decoupled from `media-core`.

---

## Pagination

```ts
interface PageInfo {
  page: number;
  perPage: number;
  totalResults?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

interface PageResult<T> {
  items: T[];
  pageInfo: PageInfo;
}
```

Cursor-style pagination is out of scope unless Pexels requires it; page/perPage is the planned model.

---

## Search and query parameters

```ts
interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  color?: string;
}

interface CuratedParams {
  page?: number;
  perPage?: number;
}

interface MediaItemParams {
  id: number | string;
  type: MediaType;
}
```

Planned core methods:

- `searchPhotos(params: SearchParams): Promise<PageResult<Photo>>`
- `searchVideos(params: SearchParams): Promise<PageResult<Video>>`
- `curatedPhotos(params?: CuratedParams): Promise<PageResult<Photo>>`
- `popularVideos(params?: CuratedParams): Promise<PageResult<Video>>` (or Pexels equivalent at implementation time)
- `getPhoto(id): Promise<Photo>`
- `getVideo(id): Promise<Video>` (where supported)

Exact Pexels endpoint mapping is finalized in [SDK_DESIGN.md](./SDK_DESIGN.md) during implementation against current Pexels docs.

---

## Client configuration

```ts
interface MediaClientConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  cache?: CacheConfig | false;
  dedupe?: boolean;
  defaultPerPage?: number;
  eventListeners?: {
    defaultConsole?: boolean;
  };
}

interface CacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}
```

```ts
interface MediaClient {
  searchPhotos(params: SearchParams): Promise<PageResult<Photo>>;
  searchVideos(params: SearchParams): Promise<PageResult<Video>>;
  curatedPhotos(params?: CuratedParams): Promise<PageResult<Photo>>;
  popularVideos(params?: CuratedParams): Promise<PageResult<Video>>;
  getPhoto(id: number | string): Promise<Photo>;
  getVideo(id: number | string): Promise<Video>;

  on(event: MediaEventType, listener: MediaEventListener): () => void;
  off(event: MediaEventType, listener: MediaEventListener): void;
  emit(event: MediaEvent): void;

  trackView(payload: MediaViewPayload): void;
  trackDownload(payload: MediaDownloadPayload): void;

  clearCache(): void;
}
```

---

## Events

```ts
type MediaEventType = 'media:view' | 'media:download';

interface MediaViewPayload {
  mediaId: number | string;
  mediaType: MediaType;
  source?: 'grid' | 'lightbox' | 'reel' | 'other';
  query?: string;
  page?: number;
  at?: string;
}

interface MediaDownloadPayload {
  mediaId: number | string;
  mediaType: MediaType;
  url?: string;
  source?: 'lightbox' | 'reel' | 'other';
  at?: string;
}

type MediaEvent =
  | { type: 'media:view'; payload: MediaViewPayload }
  | { type: 'media:download'; payload: MediaDownloadPayload };

type MediaEventListener = (event: MediaEvent) => void;
```

Subscribe/unsubscribe:

- `on` returns an unsubscribe function (preferred).
- `off` removes a specific listener.
- Default console listener is enabled unless `eventListeners.defaultConsole === false`.

---

## Errors

```ts
type MediaErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'PARSE'
  | 'UNKNOWN';

interface MediaError extends Error {
  name: 'MediaError';
  code: MediaErrorCode;
  status?: number;
  details?: unknown;
  retriable?: boolean;
}
```

Callers should use `error.code` for branching. Message strings are for humans/logs only.

---

## React hooks (`media-react`) — planned

```ts
interface MediaProviderProps {
  apiKey: string;
  client?: MediaClient;
  config?: Omit<MediaClientConfig, 'apiKey'>;
  children: React.ReactNode;
}

type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  data: T | null;
  status: QueryStatus;
  error: MediaError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

interface SearchResultState<T> extends AsyncState<PageResult<T>> {
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (n: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
}

function useMediaClient(): MediaClient;

function useSearchPhotos(
  params: SearchParams | null
): SearchResultState<Photo>;

function useSearchVideos(
  params: SearchParams | null
): SearchResultState<Video>;

function useCuratedPhotos(
  params?: CuratedParams | null
): SearchResultState<Photo>;

function useMediaItem(
  params: MediaItemParams | null
): AsyncState<Media>;

function useMediaEvents(): {
  trackView: (payload: MediaViewPayload) => void;
  trackDownload: (payload: MediaDownloadPayload) => void;
  subscribe: (type: MediaEventType, listener: MediaEventListener) => () => void;
};
```

`null` params mean “do not fetch” (enabled flag pattern).

`media-native` exposes the same hook names and semantics.

---

## UI item shape (framework-agnostic contract for UI packages)

```ts
interface UiMediaItem {
  id: string;
  type: 'photo' | 'video';
  title?: string;
  alt?: string;
  previewUrl: string;
  width?: number;
  height?: number;
  duration?: number;
}
```

Apps map `Photo` / `Video` → `UiMediaItem`. UI packages never import `media-core` types.

---

## UI props — Grid (planned)

```ts
interface GridProps<T extends UiMediaItem = UiMediaItem> {
  items: T[];
  columns?: number;
  gap?: number;
  isLoading?: boolean;
  empty?: boolean;
  onSelect?: (item: T, index: number) => void;
  getItemKey?: (item: T, index: number) => string;
  renderItem?: (args: {
    item: T;
    index: number;
    getItemProps: () => ItemPropGetters;
  }) => React.ReactNode;
}

interface ItemPropGetters {
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}
```

Headless usage may also expose `useGridState` / `getGridProps` (exact API in [UI_COMPONENTS.md](./UI_COMPONENTS.md)).

---

## UI props — Lightbox (planned)

```ts
interface LightboxProps<T extends UiMediaItem = UiMediaItem> {
  open: boolean;
  items: T[];
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onDownload?: (item: T) => void;
  renderMedia?: (item: T) => React.ReactNode;
  getOverlayProps?: () => OverlayPropGetters;
  getCloseButtonProps?: () => ButtonPropGetters;
  getNextButtonProps?: () => ButtonPropGetters;
  getPrevButtonProps?: () => ButtonPropGetters;
}

interface OverlayPropGetters {
  role: 'dialog';
  'aria-modal': true;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

interface ButtonPropGetters {
  type?: 'button';
  'aria-label': string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}
```

---

## UI props — Reel Swiper (planned)

```ts
interface ReelSwiperProps<T extends UiMediaItem = UiMediaItem> {
  items: T[];
  index: number;
  onIndexChange: (index: number) => void;
  axis?: 'y' | 'x';
  onActiveChange?: (item: T, index: number) => void;
  renderSlide?: (args: {
    item: T;
    index: number;
    isActive: boolean;
    getSlideProps: () => SlidePropGetters;
  }) => React.ReactNode;
}

interface SlidePropGetters {
  role?: string;
  'aria-hidden'?: boolean;
  tabIndex?: number;
  onFocus?: () => void;
}
```

---

## Prop getter conventions

All prop getters:

- Return plain objects safe to spread onto host elements.
- Merge caller overrides where practical (`get*Props(userProps)`).
- Encode behavior (keyboard, ARIA) without encoding visual styles.
- Avoid forcing `className` or inline styles except where required for a11y (e.g. visually hidden instructions may be content, not styles).

---

## Versioning (planned)

- Public contracts live in each package’s exported types.
- Breaking changes bump the package major version once packages are published.
- Until first release, this document is the contract source of truth.

---

## Related documents

- [SDK_DESIGN.md](./SDK_DESIGN.md)
- [UI_COMPONENTS.md](./UI_COMPONENTS.md)
- [skills/wiring-data/SKILL.md](../skills/wiring-data/SKILL.md)
- [skills/using-components/SKILL.md](../skills/using-components/SKILL.md)
