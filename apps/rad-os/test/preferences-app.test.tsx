import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PreferencesApp } from '@/components/apps/PreferencesApp';
import { useRadOSStore } from '@/store';

describe('PreferencesApp', () => {
  beforeEach(() => {
    localStorage.clear();
    useRadOSStore.setState({
      volume: 100,
      reduceMotion: false,
      invertMode: false,
      darkMode: false,
      darkModeAuto: true,
      theme: 'radiants',
      pixelScale: 1,
      cornerShape: 'scallop',
      windows: [
        {
          id: 'preferences',
          isOpen: true,
          isFullscreen: false,
          isWidget: false,
          zIndex: 1,
          position: { x: 0, y: 0 },
          activeTab: 'general',
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the designed general preference sections', () => {
    render(<PreferencesApp windowId="preferences" />);

    expect(screen.getByRole('tab', { name: /General/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Themes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Speaker Volume' })).toBeInTheDocument();
    expect(screen.getByText('Master RadOS audio output.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Display Mode' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reduce Motion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Invert Overlay' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pixel Scale' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Radiants/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Monolith/i })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /SKR/i })).not.toBeInTheDocument();
  });

  it('updates invert mode and pixel scale controls from the pane', async () => {
    const user = userEvent.setup();
    render(<PreferencesApp windowId="preferences" />);

    await user.click(screen.getByRole('checkbox', { name: /Invert overlay/i }));
    await user.click(screen.getByRole('radio', { name: '3x' }));

    expect(useRadOSStore.getState().invertMode).toBe(true);
    expect(useRadOSStore.getState().pixelScale).toBe(3);
  });
});
