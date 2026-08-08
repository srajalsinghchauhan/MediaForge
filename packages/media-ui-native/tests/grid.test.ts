import { describe, expect, it, vi } from 'vitest';
import { useMediaGrid } from '../src/grid/useMediaGrid.js';
import { createItem, renderHook } from './helpers.js';

describe('useMediaGrid (native)', () => {
  it('merges item press handlers and calls onSelect', () => {
    const onSelect = vi.fn();
    const consumerPress = vi.fn();
    const items = [createItem(1), createItem(2)];

    const { result } = renderHook(() =>
      useMediaGrid({
        items,
        isLoading: false,
        isLoadingMore: false,
        hasNextPage: true,
        loadMore: () => undefined,
        onSelect,
      }),
    );

    const props = result.current.getItemProps(items[0]!, 0, {
      onPress: consumerPress,
      testID: 'item-1',
    });

    props.onPress?.();
    expect(onSelect).toHaveBeenCalledWith(items[0], 0);
    expect(consumerPress).toHaveBeenCalled();
    expect(props.testID).toBe('item-1');
    expect(props.accessibilityRole).toBe('button');
  });

  it('supports load-more and end-reached adapters without duplicate loads while loading', () => {
    const loadMore = vi.fn();
    const items = [createItem(1)];

    const { result, rerender } = renderHook(() =>
      useMediaGrid({
        items,
        isLoading: false,
        isLoadingMore: false,
        hasNextPage: true,
        loadMore,
      }),
    );

    result.current.getLoadMoreProps().onPress?.();
    expect(loadMore).toHaveBeenCalledTimes(1);

    result.current.getListAdapterProps().onEndReached?.();
    expect(loadMore).toHaveBeenCalledTimes(2);

    rerender(() =>
      useMediaGrid({
        items,
        isLoading: false,
        isLoadingMore: true,
        hasNextPage: true,
        loadMore,
      }),
    );

    result.current.onEndReached();
    expect(loadMore).toHaveBeenCalledTimes(2);
  });
});
