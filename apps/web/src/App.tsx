import { ConfigMissing } from './components/ConfigMissing';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MediaExplorer } from './components/MediaExplorer';
import { AppProviders } from './providers/AppProviders';

export function App() {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY?.trim() ?? '';

  if (!apiKey) {
    return <ConfigMissing />;
  }

  return (
    <ErrorBoundary>
      <AppProviders apiKey={apiKey}>
        <MediaExplorer />
      </AppProviders>
    </ErrorBoundary>
  );
}
