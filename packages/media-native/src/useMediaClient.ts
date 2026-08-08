import { useContext } from 'react';
import type { MediaClient } from '@mediaforge/core';
import { MediaClientContext } from './context.js';

export function useMediaClient(): MediaClient {
  const client = useContext(MediaClientContext);
  if (!client) {
    throw new Error('useMediaClient must be used within a MediaProvider.');
  }
  return client;
}
