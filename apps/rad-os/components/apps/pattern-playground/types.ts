export interface PatternPlaygroundState {
  /** Pattern name from the registry */
  pat: string;
  /** Foreground/dot color (CSS value) */
  color: string;
  /** Background color (CSS value or 'transparent') */
  bg: string;
  /** Scale multiplier: 1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px */
  scale: 1 | 2 | 3 | 4;

  // ── Hover state ──
  hoverColor: string;
  hoverBg: string;
  hoverScale: number;
  hoverOpacity: number;

  // ── Pressed state ──
  pressedColor: string;
  pressedBg: string;
  pressedScale: number;
  pressedTranslateY: number;

  // ── Dark mode glow ──
  glowEnabled: boolean;
  glowCenter: string;
  glowSpread: number;
  glowFade: number;
}

export type CodeFormat = 'jsx' | 'css' | 'tailwind';

export interface PlaygroundPreset {
  name: string;
  description: string;
  state: PatternPlaygroundState;
}
