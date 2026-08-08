# API Contracts

> **Status:** Approved implementation contract.
>
> This document defines the public TypeScript contracts for `media-core`, `media-react`, `media-native`, `media-ui-react`, and `media-ui-native`.
>
> `@mediaforge/core` implements the media-core sections of this document.
> Implementations may use private/internal types, but public APIs must remain aligned with these contracts unless this document is intentionally updated before implementation.
>
> Runtime note: `MediaError` is exported as a class that satisfies the documented error shape.

---

# 1. Contract Principles

The system follows four rules:

1. `media-core` owns data access and SDK behavior.
2. `media-react` and `media-native` are thin platform wrappers around `media-core`.
3. UI packages are completely independent of the SDK.
4. Applications compose SDK wrappers and UI packages.

Dependency direction:

```text
Web App
 ├── media-react
 │     └── media-core
 │
 └── media-ui-react
```

React Native:

```text
React Native App
 ├── media-native
 │     └── media-core
 │
 └── media-ui-native
```

Forbidden:

```text
media-core → React
media-core → React Native
media-core → DOM

media-ui-react → media-core
media-ui-react → media-react

media-ui-native → media-core
media-ui-native → media-native
```

---

# 2. Media Models

```ts
export type MediaType = 'photo' | 'video';

export interface MediaBase {
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

export interface Photo extends MediaBase {
  type: 'photo';

  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    thumbnail: string;
  };
}

export interface VideoFile {
  id: number | string;
  quality: string;
  fileType: string;
  width: number;
  height: number;
  link: string;
}

export interface VideoPicture {
  id: number | string;
  nr: number;
  picture: string;
}

export interface Video extends MediaBase {
  type: 'video';
  duration: number;
  image: string;
  videoFiles: VideoFile[];
  videoPictures: VideoPicture[];
}

export type Media = Photo | Video;
```

The exact mapped fields may be extended when necessary to preserve useful Pexels metadata.

---

# 3. Pagination

```ts
export interface PageInfo {
  page: number;
  perPage: number;
  totalResults?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

export interface PageResult<T> {
  items: T[];
  pageInfo: PageInfo;
}
```

The core uses page-based pagination because that maps naturally to the Pexels API.

Cursor pagination is out of scope.

---

# 4. Search Parameters

```ts
export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  color?: string;
}

export interface CuratedParams {
  page?: number;
  perPage?: number;
}

export interface MediaItemParams {
  id: number | string;
}
```

The public API exposes separate methods for photos and videos where the upstream Pexels API exposes separate resources.

---

# 5. Media Client Configuration

```ts
export interface CacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}

export interface MediaClientConfig {
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
```

The API key must be configured once through the client.

The key must never:

* appear in media objects
* appear in event payloads
* be logged
* be passed to UI components

---

# 6. MediaClient

```ts
export interface MediaClient {
  searchPhotos(
    params: SearchParams
  ): Promise<PageResult<Photo>>;

  searchVideos(
    params: SearchParams
  ): Promise<PageResult<Video>>;

  curatedPhotos(
    params?: CuratedParams
  ): Promise<PageResult<Photo>>;

  popularVideos(
    params?: CuratedParams
  ): Promise<PageResult<Video>>;

  getPhoto(
    id: number | string
  ): Promise<Photo>;

  getVideo(
    id: number | string
  ): Promise<Video>;

  on(
    type: MediaEventType,
    listener: MediaEventListener
  ): () => void;

  off(
    type: MediaEventType,
    listener: MediaEventListener
  ): void;

  trackView(
    payload: MediaViewPayload
  ): void;

  trackDownload(
    payload: MediaDownloadPayload
  ): void;

  clearCache(): void;
}
```

`emit()` is intentionally not part of the public API.

Event emission is controlled internally by the SDK.

---

# 7. Events

The minimum required events are:

```ts
export type MediaEventType =
  | 'view'
  | 'download';
```

### View

```ts
export interface MediaViewPayload {
  mediaId: number | string;
  mediaType: MediaType;

  source?:
    | 'grid'
    | 'lightbox'
    | 'reel'
    | 'other';

  query?: string;

  page?: number;

  at?: string;
}
```

### Download

```ts
export interface MediaDownloadPayload {
  mediaId: number | string;

  mediaType: MediaType;

  source?:
    | 'lightbox'
    | 'reel'
    | 'other';

  at?: string;
}
```

The download event does **not** need to expose the full media URL because the application can already obtain the media object.

This reduces unnecessary sensitive/implementation data in event payloads.

### Event union

```ts
export type MediaEvent =
  | {
      type: 'view';
      payload: MediaViewPayload;
    }
  | {
      type: 'download';
      payload: MediaDownloadPayload;
    };

export type MediaEventListener =
  (event: MediaEvent) => void;
```

### Subscription

```ts
const unsubscribe = client.on('view', listener);

unsubscribe();
```

Also supported:

```ts
client.off('view', listener);
```

The SDK must support multiple listeners.

The SDK must cleanly remove listeners.

---

# 8. Default Event Listener

The SDK must register a default console listener unless explicitly disabled.

```ts
eventListeners: {
  defaultConsole: true;
}
```

The listener must never log:

* API keys
* authorization headers
* secrets

It may log safe event metadata such as:

```text
media event: view
mediaId: 123
mediaType: photo
source: grid
```

---

# 9. Errors

```ts
export type MediaErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'PARSE'
  | 'UNKNOWN';

export interface MediaError extends Error {
  name: 'MediaError';

  code: MediaErrorCode;

  status?: number;

  details?: unknown;

  retriable?: boolean;
}
```

Consumers should branch on:

```ts
error.code
```

rather than parsing error messages.

---

# 10. React Provider

`media-react` exposes:

```tsx
export interface MediaProviderProps {
  apiKey?: string;

  client?: MediaClient;

  config?: Omit<
    MediaClientConfig,
    'apiKey'
  >;

  children: React.ReactNode;
}
```

Either:

```tsx
<MediaProvider apiKey={apiKey}>
```

or:

```tsx
<MediaProvider client={client}>
```

must be supported.

Providing both uses this precedence rule:

1. If `client` is provided, that instance is used and `apiKey` / `config` are ignored for client creation.
2. Otherwise a client is created with `createMediaClient({ apiKey, ...config })`.
3. If neither a valid `client` nor a non-empty `apiKey` is provided, the provider throws.

The Provider owns the React Context.

---

# 11. React Async State

```ts
export type QueryStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

export interface AsyncState<T> {
  data: T | null;

  status: QueryStatus;

  error: MediaError | null;

  isLoading: boolean;

  isError: boolean;

  isSuccess: boolean;

  refetch: () => Promise<void>;
}
```

---

# 12. Search Hook

The React wrapper provides:

```ts
export interface SearchResultState<T>
  extends AsyncState<PageResult<T>> {
  page: number;

  perPage: number;

  hasNextPage: boolean;

  hasPrevPage: boolean;

  isFetchingNextPage: boolean;

  nextPage: () => Promise<void>;

  prevPage: () => Promise<void>;
}
```

Hooks:

```ts
function useSearchPhotos(
  params: SearchParams | null
): SearchResultState<Photo>;

function useSearchVideos(
  params: SearchParams | null
): SearchResultState<Video>;

function useCuratedPhotos(
  params?: CuratedParams | null
): SearchResultState<Photo>;
```

`null` means the query is disabled.

---

# 13. Media Item Hook

```ts
function useMediaItem(
  params: MediaItemParams | null
): AsyncState<Media>;
```

Because `MediaItemParams` only includes `id`, the wrappers resolve the item as follows:

1. Call `client.getPhoto(id)`.
2. If that fails with `NOT_FOUND`, call `client.getVideo(id)`.
3. Any other photo error is surfaced without a video fallback.

---

# 14. Client Hook

```ts
function useMediaClient(): MediaClient;
```

This returns the client configured by `MediaProvider`.

---

# 15. Event Hook

```ts
interface MediaEventActions {
  trackView(
    payload: MediaViewPayload
  ): void;

  trackDownload(
    payload: MediaDownloadPayload
  ): void;

  subscribe(
    type: MediaEventType,
    listener: MediaEventListener
  ): () => void;
}

function useMediaEvents(): MediaEventActions;
```

The hook must clean up subscriptions when the component unmounts.

---

# 16. React Native Wrapper

`media-native` follows the same conceptual contract as `media-react`.

The following concepts remain consistent:

```text
MediaProvider
useMediaClient
useSearchPhotos
useSearchVideos
useCuratedPhotos
useMediaItem
useMediaEvents
```

Implementation details may differ where required by React Native.

The wrapper must not duplicate Pexels/API business logic.

---

# 17. UI Boundary

UI packages must not consume `Media`, `Photo`, or `Video` from `media-core`.

Instead they use a minimal UI contract.

```ts
export interface UiMediaItem {
  id: number | string;

  type: 'photo' | 'video';

  title?: string;

  alt?: string;

  previewUrl: string;

  width?: number;

  height?: number;

  duration?: number;
}
```

The application maps SDK data to UI data:

```text
Photo / Video
      ↓
application mapping
      ↓
UiMediaItem
      ↓
UI package
```

This preserves UI independence.

---

# 18. Headless UI Principle

UI packages provide:

* interaction state
* accessibility behavior
* event handling
* navigation
* prop getters
* load-more behavior

They do NOT provide:

* Pexels API calls
* API authentication
* data fetching
* application state
* mandatory CSS
* mandatory visual design

---

# 19. React Grid

The React Grid is headless.

```ts
export interface GridState<T extends UiMediaItem> {
  items: T[];

  isLoading: boolean;

  isLoadingMore: boolean;

  hasNextPage: boolean;

  loadMore: () => void;
}
```

Hook:

```ts
function useMediaGrid<T extends UiMediaItem>(
  options: GridState<T>
): {
  getGridProps: (
    userProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement>;

  getItemProps: (
    item: T,
    index: number,
    userProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement>;

  getLoadMoreProps: (
    userProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>;
};
```

The Grid must support:

* item interaction
* load-more
* infinite-scroll integration
* keyboard interaction
* accessibility

The actual API request remains outside the UI package.

---

# 20. Grid Rendering

The consumer controls rendering:

```tsx
const grid = useMediaGrid({
  items,
  isLoading,
  isLoadingMore,
  hasNextPage,
  loadMore,
});

return (
  <div {...grid.getGridProps()}>
    {items.map((item, index) => (
      <article
        {...grid.getItemProps(item, index)}
      >
        ...
      </article>
    ))}
  </div>
);
```

No visual styling is imposed.

---

# 21. Lightbox

```ts
export interface LightboxState<
  T extends UiMediaItem
> {
  open: boolean;

  items: T[];

  index: number;

  onClose: () => void;

  onIndexChange: (index: number) => void;
}
```

Hook:

```ts
function useMediaLightbox<
  T extends UiMediaItem
>(
  state: LightboxState<T>
): {
  getDialogProps: (
    userProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement>;

  getCloseButtonProps: (
    userProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>;

  getNextButtonProps: (
    userProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>;

  getPreviousButtonProps: (
    userProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>;
};
```

React web implementation must support:

* Escape to close
* keyboard navigation
* focus management
* return focus to trigger
* dialog semantics
* `aria-modal`
* accessible button labels

The consumer controls:

* markup
* media rendering
* styling
* animations

---

# 22. Reel Swiper

The required behavior is vertical paging.

```ts
export interface ReelSwiperState<
  T extends UiMediaItem
> {
  items: T[];

  activeIndex: number;

  onActiveChange: (
    item: T,
    index: number
  ) => void;
}
```

Hook:

```ts
function useMediaReelSwiper<
  T extends UiMediaItem
>(
  state: ReelSwiperState<T>
): {
  getContainerProps: (
    userProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement>;

  getSlideProps: (
    item: T,
    index: number,
    userProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement>;
};
```

Required behavior:

* vertical paging
* snap behavior
* active item detection
* active item callback
* consumer-controlled rendering

---

# 23. React Native UI Contracts

The React Native UI packages follow the same behavioral concepts but use React Native-specific host props.

They must provide equivalent capabilities for:

* Grid
* Lightbox
* Reel Swiper

They must not reuse DOM-specific types such as:

```ts
React.HTMLAttributes
React.MouseEvent
HTMLButtonElement
```

The shared behavioral concepts are consistent, but platform-specific prop types are allowed.

---

# 24. Prop Getter Rules

All prop getters must:

1. Return plain objects.
2. Be safe to spread onto consumer-controlled host elements.
3. Merge user-provided handlers where practical.
4. Provide accessibility behavior.
5. Never impose visual styling.
6. Never require CSS classes.
7. Never contain Pexels/API logic.

Example:

```ts
getItemProps(item, index, userProps)
```

must merge the consumer's event handlers with internal interaction behavior rather than silently replacing them.

---

# 25. UI Callback Rules

UI components may emit callbacks such as:

```ts
onSelect
onClose
onIndexChange
onActiveChange
```

They must never automatically call the Pexels API.

If the application wants to track a view:

```text
UI interaction
      ↓
application callback
      ↓
media-react
      ↓
media-core.trackView()
```

This keeps the UI package independent.

---

# 26. API Key Boundary

Only the SDK/application integration layer knows about the API key.

Never pass:

```ts
apiKey
Authorization
```

to:

* Grid
* Lightbox
* Reel Swiper
* UI hooks
* UI components

---

# 27. Public Exports

Each package must explicitly define its public exports.

No application should rely on internal package paths.

Preferred:

```ts
import {
  MediaClient,
  MediaError,
  Photo,
  Video,
} from '@mediaforge/core';
```

Not:

```ts
import { something } from '@mediaforge/core/src/internal/...';
```

---

# 28. Contract Enforcement

The implementation must verify:

* `media-core` has no React/React Native/DOM imports.
* UI packages have no SDK imports.
* wrappers contain no Pexels HTTP implementation.
* application does not directly import `media-core`.
* UI components do not contain API-key logic.
* public types are exported intentionally.

Architecture violations should be caught through linting or automated checks where practical.

---

# 29. Contract Changes

Until the first implementation is complete, this document is the contract source of truth.

If implementation reveals a genuine problem:

1. Update this document.
2. Explain the reason in `SCOPE_AND_DECISIONS.md`.
3. Update affected packages.
4. Update tests.
5. Update relevant skills/documentation.

Do not silently change public contracts inside implementation code.

---

# 30. Assignment Coverage

These contracts directly support the required assignment features:

* framework-agnostic core
* Pexels search
* curated media
* popular/trending video media
* pagination
* single-item fetch
* authentication
* typed responses
* typed errors
* caching
* request deduplication
* view events
* download events
* subscription/unsubscription
* default event logging
* React Provider
* React hooks
* React Native wrapper
* headless Grid
* infinite scroll/load-more
* headless Lightbox
* keyboard handling
* focus handling
* Reel Swiper
* vertical snap paging
* active-item detection
* consumer-controlled markup
* consumer-controlled styling
* SDK/UI package separation
* application-level composition

The final implementation must still be audited against the original assignment before submission.
