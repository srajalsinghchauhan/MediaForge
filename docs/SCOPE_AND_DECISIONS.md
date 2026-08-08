# Scope and Decisions

> **Status:** Living decision log for the take-home. Core, wrappers, and UI packages are implemented; `apps/web` is not.

## Implementation priorities

Ordered for delivery under time constraints:

1. **Documentation & skills** — architecture, contracts, AI skills.
2. **`media-core`** — client, HTTP, types, errors, cache/dedupe, events. **Done (`@mediaforge/core`).**
3. **`media-react` / `media-native`** — provider + hooks. **Done.**
4. **`media-ui-react` / `media-ui-native`** — Grid, Lightbox, Reel Swiper (headless). **Done.**
5. **`apps/web`** — Search → Grid → Lightbox; video → Reel; styling owned by app.
6. **Docs sites / Storybook / Vercel** — polish and public links.

---

## Intentionally simplified areas

| Area | Simplification | Rationale |
| --- | --- | --- |
| Auth | Client-supplied API key; optional public env for demo | Assignment focus is SDK/UI architecture, not a BFF |
| Cache | In-memory TTL + max-entries map | Enough to demonstrate dedupe/cache without IndexedDB |
| Pagination | Page/perPage only | Matches Pexels common patterns |
| UI styling | No component CSS | Proves headless purity |
| Native | Mirror APIs; may lag web polish | Shows portability without dual full demos |
| Analytics | Console default listener | Demonstrates events without vendor lock-in |
| i18n | Out of scope | Not required for demo |
| AuthN of end users | Out of scope | Media browsing demo only |
| Core timeout config | No `timeoutMs` on `MediaClientConfig`; AbortError still maps to `TIMEOUT` | Keeps config aligned with contracts; hosts may abort via custom `fetch` |
| Video “curated” | Pexels exposes `GET /videos/popular`, not a photo-style curated videos route | Implemented as `popularVideos()` |

## Pexels API limitations / mapping notes

| Topic | Decision |
| --- | --- |
| Photos vs videos hosts/paths | Same origin `https://api.pexels.com` with `/v1/*` for photos and `/videos/*` for videos |
| Photo thumbnail | Mapped from Pexels `src.tiny` (fallback `src.small`) into contract field `src.thumbnail` |
| Video author | Mapped from Pexels `user.name` / `user.url` into `photographer` / `photographerUrl` |
| Popular videos | Uses official `GET /videos/popular` |
| Search `color` on videos | Photo search forwards `color`; video search omits `color` because it is not a stable/documented video filter in the same way |
| Empty query | Validated in core as `BAD_REQUEST` before network I/O |

---

## Features that may be cut under time constraints

If schedule slips, cut in this order:

1. Storybook / published component docs site
2. TypeDoc / published SDK docs site
3. React Native demo application (keep packages API-complete or stubbed)
4. `media-ui-native` polish (keep prop-compatible skeletons)
5. E2E browser tests
6. Advanced reel gestures / physics
7. Server-side Pexels proxy
8. Persistent caching
9. Infinite scroll helpers (page buttons suffice)

Do **not** cut:

- Package boundary rules
- Headless UI approach
- Typed errors
- Basic cache or dedupe
- View/download events + subscribe/unsubscribe
- Web demo flows (Search → Grid → Lightbox; video reel)

---

## Reasoning behind trade-offs

### Why split UI from data so aggressively?

So Grid/Lightbox/Reel can be reused with non-Pexels data and tested without network. It also forces clean composition in `apps/web`, which is a primary evaluation signal for a headless ecosystem.

### Why put cache/dedupe in `media-core`?

All adapters and platforms benefit once. React Strict Mode double-invocation is handled without special-casing every hook.

### Why allow a browser-visible API key in the demo?

Implementing a secure proxy is valuable but orthogonal to SDK layering. The limitation is documented in [SECURITY.md](./SECURITY.md) with a production recommendation.

### Why prop getters instead of styled components?

Styled systems fight host apps. Prop getters encode behavior and leave presentation to the consumer—standard headless practice (analogous to Downshift / React Aria patterns).

### Why `media-native` if the demo is web-first?

The assignment explicitly requires React Native packages. Shipping mirrored providers/hooks/components proves the core is portable even if the native demo is minimal.

---

## Future improvements

- BFF proxy with rate limiting
- Persistent cache with stale-while-revalidate
- Infinite query helpers
- Official Storybook + TypeDoc hosting
- Upload / collections APIs if Pexels supports needed flows
- Suspense / RSC integration experiments for Next.js (without breaking core purity)
- Telemetry adapter interface beyond console
- Visual regression for the demo app only

---

## Decision log

| Date | Decision |
| --- | --- |
| 2026-08-08 | Spec-first phase: docs + skills + README + gitignore only; no application/SDK source yet |
| 2026-08-08 | Enforce UI ↛ core dependency rule |
| 2026-08-08 | Events are explicit track calls, not implicit on every fetch |
| 2026-08-08 | README links remain placeholders until real URLs exist |
| 2026-08-08 | Implemented `@mediaforge/core` with Vitest, boundary lint script, and pnpm workspace |
| 2026-08-08 | Public event names are `view` / `download` per `API_CONTRACTS.md` (not `media:view`) |
| 2026-08-08 | No public `emit()`; tracking goes through `trackView` / `trackDownload` |
| 2026-08-08 | Listener exceptions are swallowed so one bad subscriber cannot break others |
| 2026-08-09 | Implemented `@mediaforge/react` and `@mediaforge/native` as thin hooks/context wrappers |
| 2026-08-09 | Provider precedence: explicit `client` wins over `apiKey`/`config` |
| 2026-08-09 | `useMediaItem` tries `getPhoto` then `getVideo` on `NOT_FOUND` because params are id-only |
| 2026-08-09 | Native package mirrors React hook API and does not import DOM/`react-dom` in source |
| 2026-08-09 | Implemented `@mediaforge/ui-react` and `@mediaforge/ui-native` as SDK-independent headless hooks |
| 2026-08-09 | Grid `onSelect` + web infinite-scroll sentinel / native `onEndReached` adapters documented in contracts |
| 2026-08-09 | Reel snap CSS is a consumer contract; packages do not ship mandatory styles |
| 2026-08-09 | Native UI uses local RN prop typings + `react-native` peerDep without importing DOM APIs |

---

## Related documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
- [AI_USAGE.md](./AI_USAGE.md)
