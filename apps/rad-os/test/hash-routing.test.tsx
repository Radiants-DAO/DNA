import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useHashRouting } from '@/hooks/useHashRouting';
import { useRadOSStore } from '@/store';

function HashRoutingHarness() {
  useHashRouting();
  return null;
}

function getOpenWindowIds() {
  return useRadOSStore
    .getState()
    .windows.filter((windowState) => windowState.isOpen)
    .map((windowState) => windowState.id)
    .sort();
}

describe('useHashRouting', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    useRadOSStore.setState({
      windows: [],
      nextZIndex: 1,
      zoomAnimation: null,
      theme: 'radiants',
    });
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    useRadOSStore.setState({
      windows: [],
      nextZIndex: 1,
      zoomAnimation: null,
      theme: 'radiants',
    });
  });

  it('treats hash changes as authoritative and closes windows removed from the hash', async () => {
    window.history.replaceState(null, '', '/#brand,manifesto');

    render(<HashRoutingHarness />);

    await waitFor(() => {
      expect(getOpenWindowIds()).toEqual(['brand', 'manifesto']);
    });

    window.history.replaceState(null, '', '/#brand');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => {
      expect(getOpenWindowIds()).toEqual(['brand']);
    });
  });

  it('closes all open windows when navigating back to an empty hash', async () => {
    window.history.replaceState(null, '', '/#brand,manifesto');

    render(<HashRoutingHarness />);

    await waitFor(() => {
      expect(getOpenWindowIds()).toEqual(['brand', 'manifesto']);
    });

    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => {
      expect(getOpenWindowIds()).toEqual([]);
    });
  });

  it('treats #monolith as a campaign alias for the MONOLITH theme and winners app', async () => {
    window.history.replaceState(null, '', '/#monolith');

    render(<HashRoutingHarness />);

    await waitFor(() => {
      const state = useRadOSStore.getState();
      expect(state.theme).toBe('monolith');
      expect(state.windows.find((w) => w.id === 'hackathon-exe')?.isOpen).toBe(true);
      expect(state.windows.find((w) => w.id === 'hackathon-exe')?.activeTab).toBe('winners');
    });
  });
});
