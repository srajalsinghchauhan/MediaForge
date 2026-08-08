export interface CacheConfig {
  ttlMs?: number;
  maxEntries?: number;
}

export interface MediaClientConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  cache?: CacheConfig | false;
  dedupe?: boolean;
  defaultPerPage?: number;
  eventListeners?: {
    defaultConsole?: boolean;
  };
}
