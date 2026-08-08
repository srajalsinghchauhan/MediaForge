import { useMemo, type ReactNode } from 'react';
import {
  createMediaClient,
  type MediaClient,
  type MediaClientConfig,
} from '@mediaforge/core';
import { MediaClientContext } from './context.js';
import { stableSerialize } from './internal/stableSerialize.js';

export interface MediaProviderProps {
  apiKey?: string;
  client?: MediaClient;
  config?: Omit<MediaClientConfig, 'apiKey'>;
  children: ReactNode;
}

export function MediaProvider(props: MediaProviderProps) {
  const { apiKey, client, config, children } = props;
  const configKey = stableSerialize(config ?? null);

  const resolvedClient = useMemo(() => {
    if (client) {
      return client;
    }

    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'MediaProvider requires either a `client` prop or a non-empty `apiKey` prop. When both are provided, `client` takes precedence.',
      );
    }

    return createMediaClient({
      apiKey,
      ...config,
    });
  }, [client, apiKey, configKey]);

  return (
    <MediaClientContext.Provider value={resolvedClient}>
      {children}
    </MediaClientContext.Provider>
  );
}
