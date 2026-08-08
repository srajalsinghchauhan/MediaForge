# MediaForge

**Headless Media SDK & Component Ecosystem**

MediaForge is a senior React/TypeScript take-home project that delivers a portable headless media SDK, framework adapters, and genuinely headless UI components for browsing Pexels media.

> **Development status:** Specification and architecture only. No SDK, UI packages, or application source code has been implemented yet. All APIs and behaviors described in this repository are **planned**.

---

## Architecture overview

```
apps/web
  ├── media-react  →  media-core
  └── media-ui-react

React Native app (planned consumer)
  ├── media-native  →  media-core
  └── media-ui-native
```

| Package | Responsibility |
| --- | --- |
| `media-core` | Platform-agnostic SDK: Pexels HTTP, auth config, cache/dedupe, pagination, typed errors, events |
| `media-react` | React provider + hooks over `media-core` |
| `media-native` | React Native provider + hooks over `media-core` |
| `media-ui-react` | Headless Grid, Lightbox, Reel Swiper for React DOM |
| `media-ui-native` | Headless Grid, Lightbox, Reel Swiper for React Native |
| `apps/web` | Demo app composing `media-react` + `media-ui-react` |

**Strict boundaries**

- `media-core` never depends on React, React Native, DOM, or UI packages.
- UI packages never depend on `media-core` or framework SDK wrappers.
- The application owns styling and presentation.

---

## Repository structure

```
MediaForge/
├── README.md
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── API_CONTRACTS.md
│   ├── SDK_DESIGN.md
│   ├── UI_COMPONENTS.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── AI_USAGE.md
│   └── SCOPE_AND_DECISIONS.md
├── skills/
│   ├── wiring-data/
│   │   └── SKILL.md
│   └── using-components/
│       └── SKILL.md
├── packages/          (planned)
│   ├── media-core/
│   ├── media-react/
│   ├── media-native/
│   ├── media-ui-react/
│   └── media-ui-native/
└── apps/              (planned)
    └── web/
```

---

## Documentation

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, dependency graph, data/event flows |
| [SECURITY.md](./docs/SECURITY.md) | API keys, secrets, XSS, logging |
| [API_CONTRACTS.md](./docs/API_CONTRACTS.md) | Planned public TypeScript contracts |
| [SDK_DESIGN.md](./docs/SDK_DESIGN.md) | MediaClient, HTTP, cache, events |
| [UI_COMPONENTS.md](./docs/UI_COMPONENTS.md) | Headless Grid, Lightbox, Reel Swiper |
| [TESTING.md](./docs/TESTING.md) | Test strategy and edge cases |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Local dev, Vercel, docs sites |
| [AI_USAGE.md](./docs/AI_USAGE.md) | AI-assisted development disclosure |
| [SCOPE_AND_DECISIONS.md](./docs/SCOPE_AND_DECISIONS.md) | Priorities, trade-offs, cuts |

---

## AI skills (planned consumption guides)

| Skill | Purpose |
| --- | --- |
| [wiring-data](./skills/wiring-data/SKILL.md) | Correctly consume `media-react` |
| [using-components](./skills/using-components/SKILL.md) | Correctly consume `media-ui-react` |

---

## Links

| Resource | URL |
| --- | --- |
| GitHub | _TBD_ |
| Live application | _TBD_ |
| SDK documentation | _TBD_ |
| Component documentation | _TBD_ |
| AI conversations | _TBD_ |

---

## Planned demo flows

The web application will demonstrate:

1. **Search → Grid → Lightbox** — text search, results grid, item detail in a lightbox.
2. **Video results → Reel-style view** — video results presented via the Reel Swiper.

---

## Getting started

Implementation has not started. See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the planned local development workflow once packages exist.
