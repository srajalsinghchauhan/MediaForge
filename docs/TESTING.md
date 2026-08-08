# Testing

> **Status:** Strategy approved. `@mediaforge/core` unit + architecture tests are implemented with Vitest.

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

### Planned tooling (to be chosen at implementation)

- Vitest or Jest for units
- Testing Library for React hooks/components
- MSW or mock `fetch` for HTTP
- dependency-cruiser / eslint boundaries for architecture tests

Do not install tools until implementation begins.

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

Planned cases:

- `params: null` → no fetch, `idle`
- Successful search → `success` + data
- Failed search → `error` with typed code
- `nextPage` / `prevPage` update page and refetch
- `refetch` repeats current params
- Unmount does not set state after resolve (no memory leak warnings)
- `useMediaEvents` subscribe cleanup on unmount

---

## Component behavior tests (`media-ui-*`)

### Grid

- Renders N items via render prop / mapping
- Activating item calls `onSelect` with index
- Keyboard activation works
- `getItemProps` merges user `onClick`
- Loading / empty flags exposed without crashing

### Lightbox

- Closed → no dialog
- Open → focus moves into dialog
- Escape calls `onClose`
- Arrow keys change index (and clamp at ends)
- `onDownload` fires when download getter clicked
- Focus restores on close

### Reel Swiper

- `onIndexChange` / `onActiveChange` fire on navigation
- Active slide flagged in render args
- Out-of-range index handled safely

Visual snapshot tests of styled app chrome are optional and belong to `apps/web`, not UI packages.

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
