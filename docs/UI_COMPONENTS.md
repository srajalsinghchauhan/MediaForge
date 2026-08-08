# UI Components

> **Status:** Implemented for `@mediaforge/ui-react` and `@mediaforge/ui-native`.

## Headless philosophy

MediaForge UI packages are **genuinely headless**:

- They provide **behavior**, **accessibility**, **keyboard/focus handling**, and **prop getters**.
- They do **not** impose colors, typography, spacing, CSS frameworks, or themes.
- The **application owns styling and presentation**.
- They do **not** depend on `@mediaforge/core`, `@mediaforge/react`, or `@mediaforge/native`.
- They accept `UiMediaItem` only; apps map SDK models → UI items.

---

## Packages

| Package | Platform | Public hooks |
| --- | --- | --- |
| `@mediaforge/ui-react` | React DOM | `useMediaGrid`, `useMediaLightbox`, `useMediaReelSwiper` |
| `@mediaforge/ui-native` | React Native | same names, RN host props |

---

## UiMediaItem

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

Defined inside each UI package. Never imported from `@mediaforge/core`.

---

## Grid (`useMediaGrid`)

### State

```ts
{
  items,
  isLoading,
  isLoadingMore,
  hasNextPage,
  loadMore,
  onSelect?, // optional
}
```

### Prop getters (web)

- `getGridProps(userProps?)`
- `getItemProps(item, index, userProps?)`
- `getLoadMoreProps(userProps?)`
- `getInfiniteScrollSentinelProps(userProps?)`

### Prop getters / adapters (native)

- `getGridProps(userProps?)`
- `getItemProps(item, index, userProps?)`
- `getLoadMoreProps(userProps?)`
- `getListAdapterProps(userProps?)` → `onEndReached`, threshold
- `onEndReached()`

### Behavior

- Selection via optional `onSelect` + merged consumer handlers
- Web keyboard: Enter/Space activate; arrows move focus between items
- Infinite scroll (web): `IntersectionObserver` on sentinel → `loadMore()`
- Guards: no `loadMore` while `isLoadingMore` or `!hasNextPage`
- No fetching, no styles

### Consumer example (web)

```tsx
const grid = useMediaGrid({
  items,
  isLoading,
  isLoadingMore,
  hasNextPage,
  loadMore,
  onSelect: (_, index) => openLightbox(index),
});

return (
  <div {...grid.getGridProps({ className: styles.grid })}>
    {items.map((item, index) => (
      <button key={item.id} {...grid.getItemProps(item, index, { className: styles.cell })}>
        <img src={item.previewUrl} alt={item.alt ?? ''} />
      </button>
    ))}
    <div {...grid.getInfiniteScrollSentinelProps()} />
  </div>
);
```

---

## Lightbox (`useMediaLightbox`)

### State

```ts
{
  open,
  items,
  index,
  onClose,
  onIndexChange,
  label?,
  labelledBy?, // web
}
```

### Returns

- `currentItem`, `canGoNext`, `canGoPrevious`
- `getDialogProps`, `getCloseButtonProps`, `getNextButtonProps`, `getPreviousButtonProps`

### Web behavior

- `role="dialog"` + `aria-modal="true"`
- Escape closes
- ArrowLeft / ArrowRight change index
- Tab cycles focus inside the dialog
- On open: store trigger, move focus into dialog
- On close/unmount: restore focus to trigger
- Document key listeners cleaned up on close/unmount

### Native behavior

- `accessibilityViewIsModal`
- Pressable next/prev/close via `onPress`
- No DOM APIs

### Consumer example (web)

```tsx
const lightbox = useMediaLightbox({ open, items, index, onClose, onIndexChange });

return open ? (
  <div {...lightbox.getDialogProps({ className: styles.dialog })}>
    {lightbox.currentItem?.type === 'video' ? (
      <video src={lightbox.currentItem.previewUrl} controls />
    ) : (
      <img src={lightbox.currentItem?.previewUrl} alt={lightbox.currentItem?.alt ?? ''} />
    )}
    <button {...lightbox.getCloseButtonProps({ className: styles.close })}>Close</button>
    <button {...lightbox.getPreviousButtonProps()}>Prev</button>
    <button {...lightbox.getNextButtonProps()}>Next</button>
  </div>
) : null;
```

---

## Reel Swiper (`useMediaReelSwiper`)

### State

```ts
{
  items,
  activeIndex,
  onActiveChange(item, index),
}
```

### Web

- `getContainerProps`, `getSlideProps`
- `IntersectionObserver` detects active slide (threshold ~0.6)
- Keyboard ArrowUp/ArrowDown / PageUp/PageDown
- No duplicate `onActiveChange` when index unchanged
- Does **not** inject CSS

### Required consumer CSS (web)

```css
.reel {
  overflow-y: auto;
  height: 100%;
  scroll-snap-type: y mandatory;
}

.slide {
  height: 100%;
  scroll-snap-align: start;
}
```

### Native

- `getContainerProps`, `getSlideProps`
- `getListAdapterProps()` for `FlatList`:
  - `pagingEnabled: true`
  - `horizontal: false`
  - `onViewableItemsChanged`
  - `viewabilityConfig`

### Consumer example (web)

```tsx
const reel = useMediaReelSwiper({ items, activeIndex, onActiveChange });

return (
  <div {...reel.getContainerProps({ className: styles.reel })}>
    {items.map((item, index) => (
      <section key={item.id} {...reel.getSlideProps(item, index, { className: styles.slide })}>
        <video src={item.previewUrl} muted playsInline />
      </section>
    ))}
  </div>
);
```

---

## Prop getter merging

All getters use internal `mergeProps`:

- Consumer `className` / `style` / `testID` preserved
- Event handlers composed (internal + consumer both run)
- Refs composed on web where used

---

## Accessibility summary

| Surface | Web | Native |
| --- | --- | --- |
| Grid | labels, keyboard activation/navigation | `accessibilityRole` / labels / press |
| Lightbox | dialog, modal, focus trap, restore | modal accessibility + labelled controls |
| Reel | orientation, active/hidden slides | active slide accessibility |

---

## Independence

These packages can be used with local/static `UiMediaItem[]` and no MediaForge SDK installed.

Forbidden in UI packages:

- `@mediaforge/core` / `react` / `native`
- Pexels URLs/auth
- `MediaClient` / `useMediaClient`

---

## Related documents

- [API_CONTRACTS.md](./API_CONTRACTS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [skills/using-components/SKILL.md](../skills/using-components/SKILL.md)
