import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMediaClient, type MediaClient } from '@mediaforge/core';
import { MediaProvider, useMediaClient } from '../src/index.js';
import { createFakeClient } from './helpers.js';

describe('MediaProvider', () => {
  it('injects an explicit client into context', () => {
    const client = createFakeClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MediaProvider client={client}>{children}</MediaProvider>
    );

    const { result } = renderHook(() => useMediaClient(), { wrapper });
    expect(result.current).toBe(client);
  });

  it('creates a client from apiKey when no client is provided', () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MediaProvider
        apiKey="test-key"
        config={{ fetch: fetchImpl, eventListeners: { defaultConsole: false } }}
      >
        {children}
      </MediaProvider>
    );

    const { result } = renderHook(() => useMediaClient(), { wrapper });
    expect(typeof result.current.searchPhotos).toBe('function');
  });

  it('prefers explicit client over apiKey', () => {
    const client = createFakeClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MediaProvider client={client} apiKey="ignored-key">
        {children}
      </MediaProvider>
    );

    const { result } = renderHook(() => useMediaClient(), { wrapper });
    expect(result.current).toBe(client);
  });

  it('keeps client identity stable across re-renders', () => {
    const client = createFakeClient();
    const identities: MediaClient[] = [];

    function Probe() {
      identities.push(useMediaClient());
      return <div>ok</div>;
    }

    const { rerender } = render(
      <MediaProvider client={client}>
        <Probe />
      </MediaProvider>,
    );

    rerender(
      <MediaProvider client={client}>
        <Probe />
      </MediaProvider>,
    );

    expect(identities[0]).toBe(client);
    expect(identities[1]).toBe(client);
    expect(screen.getByText('ok')).toBeTruthy();
  });

  it('throws when used without provider', () => {
    expect(() => renderHook(() => useMediaClient())).toThrow(
      /useMediaClient must be used within a MediaProvider/,
    );
  });

  it('throws when neither client nor apiKey is provided', () => {
    expect(() =>
      render(
        <MediaProvider>
          <div />
        </MediaProvider>,
      ),
    ).toThrow(/requires either a `client` prop or a non-empty `apiKey`/);
  });

  it('can wrap a prebuilt createMediaClient instance', () => {
    const client = createMediaClient({
      apiKey: 'key',
      fetch: vi.fn(async () => new Response('{}')),
      eventListeners: { defaultConsole: false },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MediaProvider client={client}>{children}</MediaProvider>
    );
    const { result } = renderHook(() => useMediaClient(), { wrapper });
    expect(result.current).toBe(client);
  });
});
