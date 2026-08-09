# MediaForge Web App

Demo React application that wires:

- `@mediaforge/react` for data, auth, pagination, and events
- `@mediaforge/ui-react` for headless Grid, Lightbox, and Reel behavior

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

Set:

```bash
VITE_PEXELS_API_KEY=your_pexels_key
```

## Scripts

From the repository root:

```bash
pnpm --filter @mediaforge/web dev
pnpm --filter @mediaforge/web build
pnpm --filter @mediaforge/web test
pnpm --filter @mediaforge/web typecheck
```

Or from `apps/web`:

```bash
pnpm dev
pnpm build
pnpm test
```

Local URL defaults to `http://localhost:5173`.

## Architecture

```text
apps/web
  ├─ @mediaforge/react → @mediaforge/core → Pexels
  └─ @mediaforge/ui-react
```

The app maps SDK `Photo` / `Video` models to `UiMediaItem` before rendering UI hooks.
