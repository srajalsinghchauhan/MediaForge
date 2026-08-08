import { describe, expect, it, vi } from 'vitest';
import { useMediaLightbox } from '../src/lightbox/useMediaLightbox.js';
import { createItem, renderHook } from './helpers.js';

describe('useMediaLightbox (native)', () => {
  it('exposes modal accessibility and navigates items', () => {
    const onClose = vi.fn();
    const onIndexChange = vi.fn();
    const items = [createItem(1), createItem(2), createItem(3)];

    const { result, rerender } = renderHook(() =>
      useMediaLightbox({
        open: true,
        items,
        index: 0,
        onClose,
        onIndexChange,
      }),
    );

    const dialog = result.current.getDialogProps({ testID: 'dialog' });
    expect(dialog.accessibilityViewIsModal).toBe(true);
    expect(dialog.accessibilityLabel).toBe('Item 1');
    expect(result.current.currentItem?.id).toBe(1);

    result.current.getNextButtonProps().onPress?.();
    expect(onIndexChange).toHaveBeenCalledWith(1);

    rerender(() =>
      useMediaLightbox({
        open: true,
        items,
        index: 1,
        onClose,
        onIndexChange,
      }),
    );

    result.current.getPreviousButtonProps().onPress?.();
    expect(onIndexChange).toHaveBeenCalledWith(0);

    const consumerClose = vi.fn();
    result.current.getCloseButtonProps({ onPress: consumerClose }).onPress?.();
    expect(onClose).toHaveBeenCalled();
    expect(consumerClose).toHaveBeenCalled();
  });
});
