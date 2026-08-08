# Testing

> **Status:** Strategy approved. Core, wrappers, and UI packages use Vitest. App/E2E tests remain planned.

## Testing strategy

MediaForge will use a layered test approach matching package boundaries:

| Layer | Packages | Focus |
| --- | --- | --- |
| Unit | `media-core` | HTTP mapping, cache, dedupe, errors, events |
| Unit / behavior | `media-ui-*` | Prop getters, keyboard, controlled state |
| Hook / integration | `media-react`, `media-native` | Provider, async states, pagination |
| Boundary | workspace | Dependency rules |
| Manual / E2E (optional) | `apps/web` | Search → Grid → Lightbox; video reels |

Prefer fast unit tests; keep E2E minimal under time constraints (see [SCOPE_AND_DECISIONS.md](./SCOPE_AND_DECISIONS.md)).

### Tooling in use

- Vitest for units/hooks
- Testing Library (`@testing-library/react`) for provider/hook tests
- Mock/`fake` `MediaClient` at the wrapper boundary (no live Pexels calls)
- Package `scripts/check-boundaries.mjs` for import/dependency architecture checks

---

## Unit tests (`media-core`)

Planned cases:

- Builds correct URLs and query params for search / curated / get-by-id
- Attaches Authorization header
- Maps Pexels JSON → `Photo` / `Video` / `PageResult`
- Maps HTTP status → `MediaError.code`
- Cache hit avoids network
- Cache TTL expiry refetches
- Parallel identical requests share one in-flight promise
- `clearCache()` forces refetch
- `trackView` / `trackDownload` notify subscribers
- Default console listener can be disabled
- Unsubscribe prevents further calls
- Injected `fetch` is used
- Custom `baseUrl` is respected

---

## Integration tests

Planned cases:

- Search then page 2 uses expected params
- 429 surfaces `RATE_LIMITED` through adapter hooks
- Provider supplies the same client instance to child hooks
- Changing query resets page state (define exact UX rule and test it)

---

## Hook tests (`media-react` / `media-native`)

Implemented cases include:

- Provider client injection, apiKey creation, client-precedence, missing provider errors
- `params: null` → no fetch, `idle`
- Successful search → `success` + data
- Failed search → `error` with typed code
- `nextPage` / `prevPage` update page and refetch
- `refetch` repeats current params
- Stale responses ignored after param changes
- `useMediaItem` photo hit + video fallback on `NOT_FOUND`
- `useMediaEvents` track/subscribe/unsubscribe + unmount cleanup
- Strict Mode subscription sanity
- Package dependency boundary tests

---

## Component behavior tests (`media-ui-*`)

Implemented for `@mediaforge/ui-react` and `@mediaforge/ui-native`:

### Grid

- Consumer-controlled rendering
- `onSelect` + handler merging
- Web keyboard activation/navigation
- Load-more + infinite-scroll/end-reached guards
- Architecture: no SDK imports

### Lightbox

- Dialog/modal accessibility
- Next/previous/close callbacks
- Web Escape / arrows / focus move + restore
- Handler merging

### Reel Swiper

- Active markers
- Active-item callbacks without duplicates
- Web observer + keyboard
- Native list adapter (`pagingEnabled`, viewability)

Visual snapshot tests of styled app chrome belong to `apps/web`.

---

## Architectural boundary tests

Automate (planned):

| Rule | Assertion |
| --- | --- |
| `media-core` | No imports from `react`, `react-dom`, `react-native`, `media-ui-*` |
| `media-ui-react` | No imports from `media-core`, `media-react` |
| `media-ui-native` | No imports from `media-core`, `media-native` |
| `media-react` | May import `media-core`; must not import UI packages |

Fail CI if violated.

---

## Important edge cases

| Area | Edge case |
| --- | --- |
| Search | Empty string query |
| Search | Whitespace-only query |
| Pagination | Page beyond last results |
| Pagination | `perPage` at API min/max |
| Auth | Missing API key at construction |
| Auth | 401 from Pexels |
| Network | Offline / rejected fetch |
| Network | Aborted request on param change |
| Cache | Distinct queries do not collide |
| Dedupe | Different pages do not dedupe together |
| Media | Photo vs video discrimination |
| Media | Missing optional photographer fields |
| UI | Empty `items` array |
| UI | Lightbox index out of bounds |
| UI | Rapid open/close lightbox |
| Events | Listener throws should not break emit loop (document chosen behavior) |
| RN | Same hook semantics without DOM APIs |

---

## What not to over-test (demo scope)

- Exact Pexels CDN URL formats
- Pixel-perfect CSS
- Full cross-browser swipe physics
- Live Pexels flakiness in CI (mock network)

---

## Related documents

- [SDK_DESIGN.md](./SDK_DESIGN.md)
- [UI_COMPONENTS.md](./UI_COMPONENTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
