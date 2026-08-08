import { callAll } from './callAll.js';

type PropMap = Record<string, unknown>;

const HANDLER_KEYS = new Set([
  'onPress',
  'onLongPress',
  'onPressIn',
  'onPressOut',
  'onEndReached',
  'onViewableItemsChanged',
  'onAccessibilityTap',
  'onMagicTap',
]);

export function mergeProps<T extends object>(
  ...propSets: Array<T | undefined | null>
): T {
  const result: PropMap = {};

  for (const props of propSets) {
    if (!props) {
      continue;
    }

    for (const key of Object.keys(props as PropMap)) {
      const incoming = (props as PropMap)[key];
      const existing = result[key];

      if (
        HANDLER_KEYS.has(key) &&
        typeof existing === 'function' &&
        typeof incoming === 'function'
      ) {
        result[key] = callAll(
          existing as (...args: unknown[]) => void,
          incoming as (...args: unknown[]) => void,
        );
        continue;
      }

      if (incoming !== undefined) {
        result[key] = incoming;
      }
    }
  }

  return result as T;
}
