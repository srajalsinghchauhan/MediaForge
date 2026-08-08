import { describe, expect, it, vi } from 'vitest';
import { useMediaReelSwiper } from '../src/reel/useMediaReelSwiper.js';
import { createItem, renderHook } from './helpers.js';

describe('useMediaReelSwiper (native)', () => {
  it('marks active slides and wires vertical paging adapter props', () => {
    const onActiveChange = vi.fn();
    const items = [
      createItem(1, { type: 'video' }),
      createItem(2, { type: 'video' }),
    ];

    const { result } = renderHook(() =>
      useMediaReelSwiper({
        items,
        activeIndex: 0,
        onActiveChange,
      }),
    );

    expect(result.current.getSlideProps(items[0]!, 0)['data-active']).toBe('true');
    expect(result.current.getSlideProps(items[1]!, 1)['data-active']).toBe('false');

    const adapter = result.current.getListAdapterProps();
    expect(adapter.pagingEnabled).toBe(true);
    expect(adapter.horizontal).toBe(false);

    adapter.onViewableItemsChanged?.({
      viewableItems: [{ index: 1, item: items[1] }],
    });
    expect(onActiveChange).toHaveBeenCalledWith(items[1], 1);

    adapter.onViewableItemsChanged?.({
      viewableItems: [{ index: 1, item: items[1] }],
    });
    expect(onActiveChange).toHaveBeenCalledTimes(1);
  });
});
