import { createContext } from 'react';
import type { MediaClient } from '@mediaforge/core';

export const MediaClientContext = createContext<MediaClient | null>(null);
