# Scope and Decisions

> **Status:** Living decision log for the take-home. Specs exist; implementation has not started.

## Implementation priorities

Ordered for delivery under time constraints:

1. **Documentation & skills** (this stage) — architecture, contracts, AI skills.
2. **`media-core`** — client, HTTP, types, errors, cache/dedupe, events.
3. **`media-react`** — provider + search/pagination/events hooks.
4. **`media-ui-react`** — Grid, Lightbox, Reel Swiper (headless).
5. **`apps/web`** — Search → Grid → Lightbox; video → Reel; styling owned by app.
6. **Tests** — core unit tests + boundary checks; hook/component behavior as time allows.
7. **`media-native` + `media-ui-native`** — API-parity stubs or thin implementations after web path is solid.
8. **Docs sites / Storybook / Vercel** — polish and public links.

---

## Intentionally simplified areas

| Area | Simplification | Rationale |
| --- | --- | --- |
| Auth | Client-supplied API key; optional public env for demo | Assignment focus is SDK/UI architecture, not a BFF |
| Cache | In-memory TTL map | Enough to demonstrate dedupe/cache without IndexedDB |
| Pagination | Page/perPage only | Matches Pexels common patterns |
| UI styling | No component CSS | Proves headless purity |
| Native | Mirror APIs; may lag web polish | Shows portability without dual full demos |
| Analytics | Console default listener | Demonstrates events without vendor lock-in |
| i18n | Out of scope | Not required for demo |
| AuthN of end users | Out of scope | Media browsing demo only |

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

---

## Related documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
- [AI_USAGE.md](./AI_USAGE.md)
