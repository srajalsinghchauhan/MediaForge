---
name: wiring-data
description: Teach an AI coding assistant how to correctly consume media-react for MediaForge — provider setup, auth, search, pagination, events, loading/error states, and package boundaries.
---

# Skill: Wiring Data (`media-react`)

> **API status:** Planned. Packages are not implemented yet. Follow [docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md) and [docs/SDK_DESIGN.md](../../docs/SDK_DESIGN.md). Do not invent alternate public APIs.

## When to use this skill

Use this skill when writing or reviewing application code that fetches or tracks Pexels media through **`media-react`** (and conceptually `media-native`).

Do **not** use this skill to style Grid/Lightbox/Reel — see `skills/using-components` for `media-ui-react`.

---

## Package boundaries

### Allowed

```
apps/web → media-react → media-core
apps/web → media-ui-react   (composition only; no data imports inside UI package)
```

### Forbidden

- Importing `media-core` HTTP helpers into UI packages
- Calling Pexels with raw `fetch` inside feature components when the SDK already covers the use case (prefer hooks)
- Putting API keys in `media-ui-react`
- Importing `media-ui-react` from `media-react` / `media-core`

---

## Provider setup

Wrap the app (or a subtree) once with `MediaProvider`.

### Correct

```tsx
'use client';

import { MediaProvider } from 'media-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MediaProvider apiKey={process.env.NEXT_PUBLIC_PEXELS_API_KEY ?? ''}>
      {children}
    </MediaProvider>
  );
}
```

Pass optional `config` for cache/dedupe/console listener. Alternatively pass a prebuilt `client` from `createMediaClient` (exported from `media-core` or re-exported — follow final package exports).

### Incorrect

```tsx
<MediaProvider>
  {children}
</MediaProvider>
```

Missing `apiKey` / `client` — will fail authentication.

```tsx
import { createMediaClient } from 'media-core';

const client = createMediaClient({ apiKey: 'hardcoded-secret' });
```

Never hardcode secrets. Use environment variables.

---

## Authentication

- Supply the Pexels API key via provider props or client config.
- Understand browser-exposed keys are visible (see `docs/SECURITY.md`).
- Do not log the key.
- Do not store the key in `localStorage` from app code.

---

## Search

Use search hooks with an object of params. Pass `null` to disable fetching.

### Correct

```tsx
'use client';

import { useState } from 'react';
import { useSearchPhotos } from 'media-react';

export function PhotoSearch() {
  const [query, setQuery] = useState('mountains');
  const { data, status, error, isLoading, page, nextPage, prevPage, hasNextPage } =
    useSearchPhotos(query.trim() ? { query, page: 1 } : null);

  if (isLoading) return <p>Loading…</p>;
  if (status === 'error') return <p>Error: {error?.code}</p>;

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {data?.items.map((photo) => (
          <li key={photo.id}>{photo.alt ?? photo.photographer}</li>
        ))}
      </ul>
      <button type="button" disabled={!hasNextPage} onClick={nextPage}>
        Next
      </button>
      <button type="button" onClick={prevPage}>
        Prev
      </button>
    </div>
  );
}
```

Note: Prefer wiring `page` from the hook state (or controlled params) consistently with the final hook signature in `API_CONTRACTS.md`. Do not fork pagination state blindly in three places.

### Incorrect

```tsx
const result = await fetch('https://api.pexels.com/v1/search?query=cat');
```

Bypasses SDK caching, typed errors, and auth configuration.

```tsx
import { useSearchPhotos } from 'media-ui-react';
```

UI package does not export data hooks.

---

## Pagination

- Use `page` / `perPage` on params or the helpers on `SearchResultState` (`nextPage`, `prevPage`, `setPage`).
- Expect empty `items` when past the last page.
- Changing `query` should reset to page 1 (app or hook responsibility — match SDK docs at implementation time).

### Correct

```tsx
const state = useSearchVideos({ query: 'ocean', page, perPage: 15 });
// ...
<button type="button" onClick={() => state.setPage(1)}>First</button>
```

### Incorrect

```tsx
useSearchVideos({ query: 'ocean', page: -1 });
```

Invalid page values should be avoided at the app layer.

---

## Events

Use `useMediaEvents` for view/download tracking. Emit from UX moments (lightbox open, reel active, download click), not from raw fetch success.

### Correct

```tsx
'use client';

import { useMediaEvents } from 'media-react';

function LightboxAnalytics({ mediaId }: { mediaId: string }) {
  const { trackView, trackDownload, subscribe } = useMediaEvents();

  useEffect(() => {
    trackView({ mediaId, mediaType: 'photo', source: 'lightbox' });
    return subscribe('media:download', (event) => {
      // app-specific side effect
    });
  }, [mediaId, trackView, trackDownload, subscribe]);

  return null;
}
```

### Incorrect

```tsx
trackView({ apiKey, mediaId });
```

Never put secrets in event payloads.

```tsx
client.searchPhotos(params);
client.emit({ type: 'media:view', payload: { mediaId: 'x', mediaType: 'photo' } });
```

Do not treat every search as a view. Views are user-facing impressions.

---

## Loading and error states

Always handle:

| State | UI guidance |
| --- | --- |
| `idle` | No query yet — prompt user |
| `loading` | Show app-owned skeleton/spinner |
| `success` | Render mapped items |
| `error` | Branch on `error.code` (`RATE_LIMITED`, `UNAUTHORIZED`, …) |

### Correct

```tsx
if (error?.code === 'RATE_LIMITED') {
  return <p>Try again in a moment.</p>;
}
if (error?.code === 'UNAUTHORIZED') {
  return <p>Configuration error.</p>;
}
```

### Incorrect

```tsx
if (String(error).includes('401')) { /* ... */ }
```

Do not parse message strings; use typed `code`.

---

## Mapping to UI

Keep mapping in the app:

```tsx
import { useSearchPhotos } from 'media-react';
import { Grid } from 'media-ui-react';

const { data } = useSearchPhotos({ query: 'forest' });
const items =
  data?.items.map((p) => ({
    id: String(p.id),
    type: 'photo' as const,
    previewUrl: p.src.medium,
    alt: p.alt,
    width: p.width,
    height: p.height,
  })) ?? [];

return <Grid items={items} onSelect={...} renderItem={...} />;
```

### Incorrect

```tsx
import { Grid } from 'media-ui-react';
// inside media-ui-react (library code):
import { useSearchPhotos } from 'media-react';
```

UI must not depend on data hooks.

---

## Checklist for assistants

1. Provider mounted with key/client?
2. Hooks used under the provider?
3. `null` params when disabled?
4. Loading + typed errors handled?
5. Pagination via hook helpers?
6. Events without secrets?
7. No boundary violations?
8. App maps `Photo`/`Video` → `UiMediaItem` before UI?

---

## References

- [docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md)
- [docs/SDK_DESIGN.md](../../docs/SDK_DESIGN.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [docs/SECURITY.md](../../docs/SECURITY.md)
