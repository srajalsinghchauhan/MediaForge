export function callAll<Args extends unknown[]>(
  ...handlers: Array<((...args: Args) => void) | undefined>
): (...args: Args) => void {
  return (...args: Args) => {
    for (const handler of handlers) {
      if (handler) {
        handler(...args);
      }
    }
  };
}
