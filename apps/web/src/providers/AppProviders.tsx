import type { ReactNode } from 'react';
import { MediaProvider } from '@mediaforge/react';

interface AppProvidersProps {
  apiKey: string;
  children: ReactNode;
}

export function AppProviders(props: AppProvidersProps) {
  const { apiKey, children } = props;

  return (
    <MediaProvider
      apiKey={apiKey}
      config={{
        eventListeners: { defaultConsole: true },
      }}
    >
      {children}
    </MediaProvider>
  );
}
