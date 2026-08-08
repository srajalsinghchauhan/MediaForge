import { useCallback, useRef } from 'react';
import type {
  LightboxState,
  NativePressableProps,
  NativeViewProps,
  UiMediaItem,
} from '../types.js';
import { mergeProps } from '../utils/mergeProps.js';

export interface UseMediaLightboxResult<T extends UiMediaItem> {
  currentItem: T | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  getDialogProps: (userProps?: NativeViewProps) => NativeViewProps;
  getCloseButtonProps: (userProps?: NativePressableProps) => NativePressableProps;
  getNextButtonProps: (userProps?: NativePressableProps) => NativePressableProps;
  getPreviousButtonProps: (
    userProps?: NativePressableProps,
  ) => NativePressableProps;
}

export function useMediaLightbox<T extends UiMediaItem>(
  state: LightboxState<T>,
): UseMediaLightboxResult<T> {
  const { open, items, index, onClose, onIndexChange, label } = state;
  const onCloseRef = useRef(onClose);
  const onIndexChangeRef = useRef(onIndexChange);

  onCloseRef.current = onClose;
  onIndexChangeRef.current = onIndexChange;

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

  const getDialogProps = useCallback(
    (userProps?: NativeViewProps) =>
      mergeProps<NativeViewProps>(
        {
          accessibilityRole: 'alert',
          accessible: true,
          accessibilityViewIsModal: true,
          accessibilityLabel:
            label ??
            currentItem?.alt ??
            currentItem?.title ??
            'Media lightbox',
          importantForAccessibility: open ? 'yes' : 'no-hide-descendants',
        },
        userProps,
      ),
    [currentItem, label, open],
  );

  const getCloseButtonProps = useCallback(
    (userProps?: NativePressableProps) =>
      mergeProps<NativePressableProps>(
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Close lightbox',
          onPress: () => {
            onCloseRef.current();
          },
        },
        userProps,
      ),
    [],
  );

  const getNextButtonProps = useCallback(
    (userProps?: NativePressableProps) =>
      mergeProps<NativePressableProps>(
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Next media item',
          disabled: !canGoNext,
          accessibilityState: { disabled: !canGoNext },
          onPress: () => {
            goNext();
          },
        },
        userProps,
      ),
    [canGoNext, goNext],
  );

  const getPreviousButtonProps = useCallback(
    (userProps?: NativePressableProps) =>
      mergeProps<NativePressableProps>(
        {
          accessibilityRole: 'button',
          accessibilityLabel: 'Previous media item',
          disabled: !canGoPrevious,
          accessibilityState: { disabled: !canGoPrevious },
          onPress: () => {
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
