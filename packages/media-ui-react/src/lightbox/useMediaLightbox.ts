import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { LightboxState, UiMediaItem } from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';
import type { WebButtonProps, WebElementProps } from '../utils/domProps.js';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface UseMediaLightboxResult<T extends UiMediaItem> {
  currentItem: T | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  getDialogProps: (userProps?: WebElementProps) => WebElementProps;
  getCloseButtonProps: (userProps?: WebButtonProps) => WebButtonProps;
  getNextButtonProps: (userProps?: WebButtonProps) => WebButtonProps;
  getPreviousButtonProps: (userProps?: WebButtonProps) => WebButtonProps;
}

export function useMediaLightbox<T extends UiMediaItem>(
  state: LightboxState<T>,
): UseMediaLightboxResult<T> {
  const { open, items, index, onClose, onIndexChange, labelledBy, label } = state;
  const dialogRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onIndexChangeRef = useRef(onIndexChange);
  const reactId = useId();
  const labelId = labelledBy ?? `${reactId}-label`;

  onCloseRef.current = onClose;
  onIndexChangeRef.current = onIndexChange;

  if (open && !wasOpenRef.current) {
    previouslyFocusedRef.current =
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  wasOpenRef.current = open;

  const currentItem = items[index] ?? null;
  const canGoNext = index < items.length - 1;
  const canGoPrevious = index > 0;

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      onIndexChangeRef.current(index + 1);
    }
  }, [index, items.length]);

  const goPrevious = useCallback(() => {
    if (index > 0) {
      onIndexChangeRef.current(index - 1);
    }
  }, [index]);

  const focusDialog = useCallback((dialog: HTMLElement) => {
    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const target = focusable[0] ?? dialog;
    target.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    if (dialogRef.current) {
      focusDialog(dialogRef.current);
    }

    return () => {
      const trigger = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      trigger?.focus?.();
    };
  }, [open, focusDialog]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (index < items.length - 1) {
          onIndexChangeRef.current(index + 1);
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (index > 0) {
          onIndexChangeRef.current(index - 1);
        }
        return;
      }

      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) {
          return;
        }

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !dialog.contains(active)) {
            event.preventDefault();
            last?.focus();
          }
          return;
        }

        if (active === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, index, items.length]);

  const setDialogRef = useCallback((node: HTMLElement | null) => {
    dialogRef.current = node;
  }, []);

  const getDialogProps = useCallback(
    (userProps?: WebElementProps) => {
      const labelling = label
        ? { 'aria-label': label }
        : labelledBy
          ? { 'aria-labelledby': labelId }
          : {
              'aria-label':
                currentItem?.alt ?? currentItem?.title ?? 'Media lightbox',
            };

      return mergeProps<WebElementProps>(
        {
          role: 'dialog',
          'aria-modal': true,
          tabIndex: -1,
          ref: setDialogRef,
          ...labelling,
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              onCloseRef.current();
            }
          },
        },
        userProps,
      );
    },
    [currentItem, label, labelId, labelledBy, setDialogRef],
  );

  const getCloseButtonProps = useCallback(
    (userProps?: WebButtonProps) =>
      mergeProps<WebButtonProps>(
        {
          type: 'button',
          'aria-label': 'Close lightbox',
          onClick: () => {
            onCloseRef.current();
          },
        },
        userProps,
      ),
    [],
  );

  const getNextButtonProps = useCallback(
    (userProps?: WebButtonProps) =>
      mergeProps<WebButtonProps>(
        {
          type: 'button',
          'aria-label': 'Next media item',
          disabled: !canGoNext,
          onClick: () => {
            goNext();
          },
        },
        userProps,
      ),
    [canGoNext, goNext],
  );

  const getPreviousButtonProps = useCallback(
    (userProps?: WebButtonProps) =>
      mergeProps<WebButtonProps>(
        {
          type: 'button',
          'aria-label': 'Previous media item',
          disabled: !canGoPrevious,
          onClick: () => {
            goPrevious();
          },
        },
        userProps,
      ),
    [canGoPrevious, goPrevious],
  );

  return {
    currentItem,
    canGoNext,
    canGoPrevious,
    getDialogProps,
    getCloseButtonProps,
    getNextButtonProps,
    getPreviousButtonProps,
  };
}
