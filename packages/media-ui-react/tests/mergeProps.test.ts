import { describe, expect, it, vi } from 'vitest';
import { mergeProps } from '../src/utils/mergeProps.js';

describe('mergeProps', () => {
  it('merges event handlers and preserves consumer props', () => {
    const internal = vi.fn();
    const consumer = vi.fn();

    const merged = mergeProps(
      { onClick: internal, role: 'group' },
      { onClick: consumer, className: 'card' },
    );

    merged.onClick?.({} as never);
    expect(internal).toHaveBeenCalled();
    expect(consumer).toHaveBeenCalled();
    expect(merged.className).toBe('card');
    expect(merged.role).toBe('group');
  });
});
