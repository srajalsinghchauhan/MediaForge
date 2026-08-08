import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useMediaLightbox } from '../src/lightbox/useMediaLightbox.js';
import { createItem } from './helpers.js';

function LightboxHarness({
  initiallyOpen = true,
  onClose = () => undefined,
  onIndexChange,
}: {
  initiallyOpen?: boolean;
  onClose?: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const items = [createItem(1), createItem(2), createItem(3)];
  const [open, setOpen] = useState(initiallyOpen);
  const [index, setIndex] = useState(0);

  const lightbox = useMediaLightbox({
    open,
    items,
    index,
    onClose: () => {
      setOpen(false);
      onClose();
    },
    onIndexChange: (next) => {
      setIndex(next);
      onIndexChange?.(next);
    },
  });

  return (
    <div>
      <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <div {...lightbox.getDialogProps({ 'data-testid': 'dialog' })}>
          <h2>{lightbox.currentItem?.alt}</h2>
          <button {...lightbox.getCloseButtonProps({ 'data-testid': 'close' })}>
            Close
          </button>
          <button {...lightbox.getPreviousButtonProps({ 'data-testid': 'prev' })}>
            Prev
          </button>
          <button {...lightbox.getNextButtonProps({ 'data-testid': 'next' })}>
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

describe('useMediaLightbox', () => {
  it('exposes dialog accessibility attributes', () => {
    render(<LightboxHarness />);
    const dialog = screen.getByTestId('dialog');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('navigates with next/previous controls and merges callbacks', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<LightboxHarness onIndexChange={onIndexChange} />);

    await user.click(screen.getByTestId('next'));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('Item 2')).toBeTruthy();

    await user.click(screen.getByTestId('prev'));
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('closes with Escape and the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LightboxHarness onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();

    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByTestId('close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('supports ArrowLeft and ArrowRight', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<LightboxHarness onIndexChange={onIndexChange} />);

    await user.keyboard('{ArrowRight}');
    expect(onIndexChange).toHaveBeenCalledWith(1);

    await user.keyboard('{ArrowLeft}');
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('moves focus into the dialog on open and restores it on close', async () => {
    const user = userEvent.setup();
    render(<LightboxHarness initiallyOpen={false} />);

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await user.click(trigger);
    const dialog = await screen.findByTestId('dialog');
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    await user.click(screen.getByTestId('close'));
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('merges consumer close handlers', async () => {
    const user = userEvent.setup();
    const consumerClose = vi.fn();

    function Case() {
      const items = [createItem(1)];
      const lightbox = useMediaLightbox({
        open: true,
        items,
        index: 0,
        onClose: () => undefined,
        onIndexChange: () => undefined,
      });

      return (
        <div {...lightbox.getDialogProps()}>
          <button
            {...lightbox.getCloseButtonProps({
              onClick: consumerClose,
              'data-testid': 'close-merged',
            })}
          >
            Close
          </button>
        </div>
      );
    }

    render(<Case />);
    await user.click(screen.getByTestId('close-merged'));
    expect(consumerClose).toHaveBeenCalled();
  });
});
