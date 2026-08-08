import { callAll } from './callAll.js';

type PropMap = Record<string, unknown>;

const HANDLER_PREFIX = /^on[A-Z]/;

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
        HANDLER_PREFIX.test(key) &&
        typeof existing === 'function' &&
        typeof incoming === 'function'
      ) {
        result[key] = callAll(
          existing as (...args: unknown[]) => void,
          incoming as (...args: unknown[]) => void,
        );
        continue;
      }

      if (key === 'ref') {
        result[key] = mergeRefs(existing, incoming);
        continue;
      }

      if (incoming !== undefined) {
        result[key] = incoming;
      }
    }
  }

  return result as T;
}

function mergeRefs(a: unknown, b: unknown): unknown {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }

  return (value: unknown) => {
    setRef(a, value);
    setRef(b, value);
  };
}

function setRef(ref: unknown, value: unknown): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref && typeof ref === 'object' && 'current' in (ref as object)) {
    (ref as { current: unknown }).current = value;
  }
}
