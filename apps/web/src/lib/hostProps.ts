export function hostProps<T extends object>(props: T): Record<string, unknown> {
  return props as Record<string, unknown>;
}
