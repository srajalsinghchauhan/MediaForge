---
name: using-components
description: Teach an AI coding assistant how to correctly consume media-ui-react for MediaForge — Grid, Lightbox, Reel Swiper, prop getters, styling, accessibility, composition, and package boundaries.
---

# Skill: Using Components (`media-ui-react`)

> **API status:** Planned. Packages are not implemented yet. Follow [docs/UI_COMPONENTS.md](../../docs/UI_COMPONENTS.md) and [docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md). Do not invent styled wrappers that violate headless rules.

## When to use this skill

Use this skill when building or reviewing UI that uses **`media-ui-react`** (Grid, Lightbox, Reel Swiper) or the mirrored **`media-ui-native`** APIs.

For data fetching and events, use `skills/wiring-data` instead.

---

## Package boundaries

### Allowed

```
apps/web → media-ui-react
apps/web → media-react   (separate import; compose in the app)
```

### Forbidden

- `media-ui-react` importing `media-core` or `media-react`
- Fetching Pexels inside Grid/Lightbox/Reel
- Shipping mandatory CSS/theme dependencies from the UI package
- Assuming Tailwind class names inside the library

The **application** composes data + UI.

---

## Headless rules (non-negotiable)

1. Behavior and accessibility live in the library.
2. Colors, spacing, typography, and layout chrome live in the app.
3. Prefer **prop getters** / render props over closed, pre-styled markup.
4. Items use the minimal `UiMediaItem` shape — not Pexels SDK types.

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

---

## Grid

### Purpose

Selectable collection for Search → Grid → Lightbox.

### Correct

```tsx
'use client';

import { Grid } from 'media-ui-react';
import styles from './gallery.module.css';

export function GalleryGrid({
  items,
  onSelect,
}: {
  items: UiMediaItem[];
  onSelect: (item: UiMediaItem, index: number) => void;
}) {
  return (
    <Grid
      items={items}
      onSelect={onSelect}
      renderItem={({ item, index, getItemProps }) => (
        <button
          key={item.id}
          {...getItemProps()}
          className={styles.cell}
        >
          <img src={item.previewUrl} alt={item.alt ?? ''} className={styles.thumb} />
        </button>
      )}
    />
  );
}
```

If the library exposes `useGrid`:

```tsx
const grid = useGrid({ items, onSelect });

return (
  <div {...grid.getGridProps({ className: styles.grid })}>
    {items.map((item, index) => (
      <button
        key={item.id}
        {...grid.getItemProps({ index, className: styles.cell })}
      >
        <img src={item.previewUrl} alt={item.alt ?? ''} />
      </button>
    ))}
  </div>
);
```

### Incorrect

```tsx
import { Grid } from 'media-ui-react';
import { useSearchPhotos } from 'media-react';

export function Grid() {
  const { data } = useSearchPhotos({ query: 'cat' });
  // implemented inside media-ui-react package
}
```

UI package must not fetch.

```tsx
<Grid items={items} className="pexels-dark-card-shadow-xl rounded-full" />
```

Do not rely on the library providing a design system. App styles are fine; library-mandated look is not.

---

## Lightbox

### Purpose

Controlled modal for the selected index with keyboard and focus management.

### Correct

```tsx
'use client';

import { Lightbox } from 'media-ui-react';
import styles from './lightbox.module.css';

export function AppLightbox(props: {
  open: boolean;
  items: UiMediaItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDownload: (item: UiMediaItem) => void;
}) {
  return (
    <Lightbox
      open={props.open}
      items={props.items}
      index={props.index}
      onClose={props.onClose}
      onIndexChange={props.onIndexChange}
      onDownload={props.onDownload}
      renderMedia={(item) =>
        item.type === 'video' ? (
          <video className={styles.media} src={item.previewUrl} controls />
        ) : (
          <img className={styles.media} src={item.previewUrl} alt={item.alt ?? ''} />
        )
      }
    />
  );
}
```

Wire analytics in the app when opening or downloading (`useMediaEvents` from `media-react`), not inside the UI package.

### Incorrect

```tsx
<Lightbox open items={items} index={0} onClose={() => {}} />
```

Missing controlled handlers / media renderer leads to unusable chrome. Always provide `renderMedia` (or documented equivalent) and style in the app.

```tsx
dangerouslySetInnerHTML={{ __html: item.alt }}
```

Never inject API text as HTML.

---

## Reel Swiper

### Purpose

Reel-style browsing for video results. Controlled index; app owns video playback.

### Correct

```tsx
'use client';

import { ReelSwiper } from 'media-ui-react';
import { useMediaEvents } from 'media-react';
import styles from './reel.module.css';

export function VideoReel({
  items,
  index,
  onIndexChange,
}: {
  items: UiMediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const { trackView } = useMediaEvents();

  return (
    <ReelSwiper
      items={items}
      index={index}
      axis="y"
      onIndexChange={onIndexChange}
      onActiveChange={(item, i) => {
        trackView({ mediaId: item.id, mediaType: 'video', source: 'reel', page: i });
      }}
      renderSlide={({ item, isActive, getSlideProps }) => (
        <div {...getSlideProps()} className={styles.slide}>
          <video
            className={styles.video}
            src={item.previewUrl}
            muted
            playsInline
            autoPlay={isActive}
          />
        </div>
      )}
    />
  );
}
```

Note the composition: **data events from `media-react`**, **behavior from `media-ui-react`**, **styles from the app**.

### Incorrect

```tsx
import { ReelSwiper, useSearchVideos } from 'media-ui-react';
```

Reel does not export search hooks.

```tsx
<ReelSwiper items={videosFromSdkWithoutMapping} />
```

Map SDK `Video` → `UiMediaItem` in the app first (`id: String(video.id)`, `previewUrl` from an appropriate video file/picture field).

---

## Prop getters

### Correct merge

```tsx
<button
  {...getItemProps({
    className: styles.cell,
    onClick: (e) => {
      analytics.click();
    },
  })}
/>
```

Library and user handlers should both run (library merges).

### Incorrect

```tsx
<button
  onClick={myClick}
  {...getItemProps()}
/>
```

Spreading getters after your handler may overwrite `onClick` and drop app behavior — or the reverse if order is wrong. Prefer passing user props **into** `get*Props`.

---

## Styling

| Do | Don't |
| --- | --- |
| App CSS modules / design tokens | Expect library theme provider |
| Pass `className` via prop getters | Fork library to hardcode colors |
| Own loading skeletons in the app | Demand the library ship a spinner skin |

---

## Accessibility

Assistants must preserve:

- Keyboard activation on grid items
- Lightbox dialog semantics, focus trap, Escape
- Reel keyboard next/prev where supported
- Meaningful `aria-label` / `alt` from item data

Do not remove ARIA props from getters when wrapping elements.

### Incorrect

```tsx
<div onClick={...}>
  {/* stripped getItemProps — loses keyboard + roles */}
</div>
```

---

## Composition patterns

### Search → Grid → Lightbox

```tsx
'use client';

function SearchExperience() {
  const search = useSearchPhotos({ query });
  const items = mapPhotos(search.data?.items);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <>
      <Grid
        items={items}
        onSelect={(_, i) => {
          setIndex(i);
          setOpen(true);
        }}
        renderItem={...}
      />
      <Lightbox
        open={open}
        items={items}
        index={index}
        onClose={() => setOpen(false)}
        onIndexChange={setIndex}
        renderMedia={...}
      />
    </>
  );
}
```

### Video → Reel

Map `useSearchVideos` results → `UiMediaItem[]` → `ReelSwiper`.

---

## Checklist for assistants

1. UI imported from `media-ui-react` only for components?
2. Data from `media-react` only in app code?
3. Items mapped to `UiMediaItem`?
4. Styles applied by the app via getters / `className`?
5. Lightbox controlled (`open`, `index`, handlers)?
6. Reel playback based on `isActive`?
7. A11y props preserved?
8. No secrets / fetch inside UI package?

---

## References

- [docs/UI_COMPONENTS.md](../../docs/UI_COMPONENTS.md)
- [docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [skills/wiring-data/SKILL.md](../wiring-data/SKILL.md)
