# SDK Design

> **Status:** `media-core` (`@mediaforge/core`) is implemented. Adapter and UI packages remain planned.

## Goals

- Portable TypeScript client for Pexels media.
- Zero dependency on React, React Native, or DOM inside `media-core`.
- Predictable caching and in-flight request deduplication.
- Typed responses and typed errors.
- Pluggable events for view / download tracking.
- Thin framework adapters that only manage lifecycle and React state (planned).

---

## MediaClient

Public factory:

```ts
import { createMediaClient } from '@mediaforge/core';

const client = createMediaClient({
  apiKey,
  fetch,
  baseUrl,
  cache,
  dedupe,
  defaultPerPage,
  eventListeners,
});
```

| Concern | Implemented behavior |
| --- | --- |
| Configuration | Requires non-empty `apiKey`; defaults applied for base URL, perPage, cache, dedupe, console listener |
| Resource methods | `searchPhotos`, `curatedPhotos`, `getPhoto`, `searchVideos`, `popularVideos`, `getVideo` |
| HTTP | Shared `HttpClient` using injectable `fetch` |
| Cache | In-memory TTL + max-entries map |
| Dedupe | In-flight promise map keyed like the cache |
| Events | Internal emitter; public `on` / `off` / `trackView` / `trackDownload` (no public `emit`) |
| Isolation | Each client instance has its own cache, dedupe map, and listeners |

---

## HTTP layer

```
MediaClient method
  → normalize params
  → build URL + query string
  → cache key
  → dedupe / cache lookup
  → HttpClient.getJson
  → map to Photo / Video / PageResult
  → store cache
  → return
```

Defaults:

- `baseUrl`: `https://api.pexels.com`
- Authorization header value: the API key (Pexels convention)
- Injected `fetch` preferred; otherwise `globalThis.fetch`

### Endpoint mapping

| Method | Path |
| --- | --- |
| `searchPhotos` | `GET /v1/search` |
| `curatedPhotos` | `GET /v1/curated` |
| `getPhoto` | `GET /v1/photos/:id` |
| `searchVideos` | `GET /videos/search` |
| `popularVideos` | `GET /videos/popular` |
| `getVideo` | `GET /videos/videos/:id` |

`baseUrl` must be the API origin (or a proxy that preserves these paths). Do not set it to `.../v1` or video routes will break.

Mappers convert Pexels snake_case payloads into the normalized contracts in [API_CONTRACTS.md](./API_CONTRACTS.md).

Photo `src.thumbnail` maps from Pexels `src.tiny` (fallback `src.small`).
Video photographer fields map from Pexels `user.name` / `user.url`.

---

## Authentication

- API key is required at construction.
- Stored only inside the client HTTP layer.
- Never returned on media objects, events, or logs.
- Core does not read environment variables; the host supplies the key.

See [SECURITY.md](./SECURITY.md).

---

## Caching

| Setting | Default |
| --- | --- |
| Enabled | `true` (`cache: false` disables) |
| TTL | `60_000` ms |
| Max entries | `100` |
| Key | `method?sorted=params` |

Rules:

- Only successful responses are cached.
- Errors are not cached.
- `clearCache()` wipes the instance cache.
- Cache keys never include the API key.

---

## Request deduplication

When `dedupe: true` (default):

1. Use the same key as the cache.
2. Concurrent identical callers share one in-flight promise.
3. The in-flight entry is removed on settle (success or failure).
4. Failures do not permanently poison the map.

---

## Pagination

- Page-based (`page`, `per_page` upstream → `perPage` in contracts).
- `PageInfo.nextPage` / `prevPage` derived from Pexels `next_page` / `prev_page` when present, otherwise from `total_results`.
- Empty / whitespace search queries throw `BAD_REQUEST` before networking.
- `page < 1` is normalized to `1`.

---

## Events

Public event types:

- `view`
- `download`

APIs:

- `on(type, listener) => unsubscribe`
- `off(type, listener)`
- `trackView(payload)`
- `trackDownload(payload)`

Implementation notes:

- No public `emit()`.
- Fetching media does **not** auto-track views/downloads.
- A throwing listener is caught so other listeners still run.
- `at` defaults to an ISO timestamp when omitted.

### Default console listener

Enabled unless `eventListeners.defaultConsole === false`.

Logs safe lines such as:

```text
[MediaForge] view
mediaId: 123
mediaType: photo
source: grid
```

Never logs API keys or Authorization headers.

---

## Errors

Failures surface as `MediaError` with `code`:

| Condition | Code | Retriable |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | no |
| 401 | `UNAUTHORIZED` | no |
| 403 | `FORBIDDEN` | no |
| 404 | `NOT_FOUND` | no |
| 429 | `RATE_LIMITED` | yes |
| Network failure | `NETWORK` | yes |
| Abort | `TIMEOUT` | yes |
| Invalid JSON / invalid payload | `PARSE` | no |
| Other HTTP | `UNKNOWN` | no |

Error `details` scrub keys that look like authorization / api key fields.

---

## Package layout

```text
packages/media-core/
  src/
    index.ts
    client/
    cache/
    events/
    errors/
    http/
    mappers/
    types/
  tests/
```

Public entry: `@mediaforge/core` → `src/index.ts` / `dist/index.js`.

---

## Portability

`media-core` constraints (enforced by lint script + architecture tests):

- No `react` / `react-dom` / `react-native` imports
- No `window` / `document` / `localStorage` usage
- Testable in Node with mock `fetch`

---

## Adapters (not implemented in this phase)

`media-react` / `media-native` remain planned thin wrappers over `createMediaClient`.

---

## Related documents

- [API_CONTRACTS.md](./API_CONTRACTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
- [SCOPE_AND_DECISIONS.md](./SCOPE_AND_DECISIONS.md)
