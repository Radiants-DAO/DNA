import type { PlaygroundPreset } from './types';

export const PRESETS: PlaygroundPreset[] = [
  {
    name: 'Classic Ink',
    description: 'Ink on cream — the default RDNA look',
    state: {
      pat: 'checkerboard',
      color: 'var(--color-ink)',
      bg: 'transparent',
      scale: 2,
      glowEnabled: true,
      glowCenter: 'var(--color-sun-yellow)',
      glowRadius: 180,
      glowBase: 'oklch(0.45 0.01 85)',
    },
  },
  {
    name: 'Sun Glow',
    description: 'Yellow patterns with tight warm glow',
    state: {
      pat: 'diagonal-dots',
      color: 'var(--color-sun-yellow)',
      bg: 'var(--color-ink)',
      scale: 2,
      glowEnabled: true,
      glowCenter: 'var(--color-sun-yellow)',
      glowRadius: 120,
      glowBase: 'oklch(0.35 0.02 85)',
    },
  },
  {
    name: 'Neon Grid',
    description: 'Mint on ink — cyberpunk terminal',
    state: {
      pat: 'grid',
      color: 'var(--color-mint)',
      bg: 'var(--color-ink)',
      scale: 3,
      glowEnabled: true,
      glowCenter: 'var(--color-mint)',
      glowRadius: 200,
      glowBase: 'oklch(0.3 0.01 160)',
    },
  },
  {
    name: 'Cream Paper',
    description: 'Subtle texture for light backgrounds',
    state: {
      pat: 'dust',
      color: 'var(--color-ink)',
      bg: 'var(--color-cream)',
      scale: 1,
      glowEnabled: false,
      glowCenter: 'var(--color-sun-yellow)',
      glowRadius: 180,
      glowBase: 'oklch(0.45 0.01 85)',
    },
  },
  {
    name: 'Warm Spot',
    description: 'Sunset glow with wide radius',
    state: {
      pat: 'confetti',
      color: 'var(--color-ink)',
      bg: 'transparent',
      scale: 2,
      glowEnabled: true,
      glowCenter: 'var(--color-sunset-fuzz)',
      glowRadius: 250,
      glowBase: 'oklch(0.4 0.02 60)',
    },
  },
  {
    name: 'Deep Fill',
    description: 'Dense pattern with tight cursor spot',
    state: {
      pat: 'fill-88',
      color: 'var(--color-ink)',
      bg: 'var(--color-cream)',
      scale: 2,
      glowEnabled: true,
      glowCenter: 'var(--color-sun-yellow)',
      glowRadius: 100,
      glowBase: 'oklch(0.5 0.01 85)',
    },
  },
];

export const DEFAULT_STATE = PRESETS[0].state;
