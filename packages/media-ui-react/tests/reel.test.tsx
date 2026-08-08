import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useMediaReelSwiper } from '../src/reel/useMediaReelSwiper.js';
import { createItem, installIntersectionObserverMock } from './helpers.js';

function ReelHarness({
  onActiveChange,
}: {
  onActiveChange?: (id: number | string, index: number) => void;
}) {
  const items = [
    createItem(1, { type: 'video' }),
    createItem(2, { type: 'video' }),
    createItem(3, { type: 'video' }),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const reel = useMediaReelSwiper({
    items,
    activeIndex,
    onActiveChange: (item, index) => {
      setActiveIndex(index);
      onActiveChange?.(item.id, index);
    },
  });

  return (
    <div {...reel.getContainerProps({ 'data-testid': 'reel' })}>
      {items.map((item, index) => (
        <div
          key={item.id}
          {...reel.getSlideProps(item, index, { className: 'slide' })}
        >
          {item.alt}
        </div>
      ))}
    </div>
  );
}

describe('useMediaReelSwiper', () => {
  it('renders slides with consumer class names and active markers', () => {
    render(<ReelHarness />);
    expect(screen.getByText('Item 1').className).toContain('slide');
    expect(screen.getByText('Item 1').getAttribute('data-active')).toBe('true');
    expect(screen.getByText('Item 2').getAttribute('data-active')).toBe('false');
  });

  it('updates active item from keyboard navigation without duplicate unchanged callbacks', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<ReelHarness onActiveChange={onActiveChange} />);

    screen.getByTestId('reel').focus();
    await user.keyboard('{ArrowDown}');
    expect(onActiveChange).toHaveBeenCalledWith(2, 1);

    const calls = onActiveChange.mock.calls.length;
    await user.keyboard('{ArrowDown}');
    expect(onActiveChange).toHaveBeenCalledWith(3, 2);
    expect(onActiveChange.mock.calls.length).toBe(calls + 1);
  });

  it('updates active item from intersection observer and cleans up', () => {
    const observer = installIntersectionObserverMock();
    const onActiveChange = vi.fn();
    const { unmount } = render(<ReelHarness onActiveChange={onActiveChange} />);

    const second = screen.getByText('Item 2');
    const instance = observer.instances[0];
    expect(instance).toBeTruthy();

    instance?.elements.clear();
    instance?.elements.add(second);
    instance?.trigger(true);

    expect(onActiveChange).toHaveBeenCalledWith(2, 1);

    unmount();
    expect(() => observer.triggerAll(true)).not.toThrow();
    observer.restore();
  });

  it('exposes vertical orientation contract on the container', () => {
    render(<ReelHarness />);
    expect(screen.getByTestId('reel').getAttribute('aria-orientation')).toBe(
      'vertical',
    );
  });
});
