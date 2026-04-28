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
    render(<PreferencesApp />);

    expect(screen.getByRole('heading', { name: 'Corner Shape' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Display' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Speaker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Round' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chamfer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scallop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light display mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark display mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Radiants/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SKR/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MONOLITH/i })).toBeInTheDocument();
  });

  it('updates display, corner, and theme controls from the pane', async () => {
    const user = userEvent.setup();
    render(<PreferencesApp />);

    await user.click(screen.getByRole('button', { name: 'Dark display mode' }));
    await user.click(screen.getByRole('button', { name: 'Round' }));
    await user.click(screen.getByRole('button', { name: /SKR/i }));

    expect(useRadOSStore.getState().darkModeAuto).toBe(false);
    expect(useRadOSStore.getState().darkMode).toBe(true);
    expect(useRadOSStore.getState().cornerShape).toBe('circle');
    expect(useRadOSStore.getState().theme).toBe('skr');
  });
});
