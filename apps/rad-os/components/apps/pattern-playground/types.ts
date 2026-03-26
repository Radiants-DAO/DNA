export interface PatternPlaygroundState {
  /** Pattern name from the registry */
  pat: string;
  /** Foreground/dot color (CSS value) */
  color: string;
  /** Background color (CSS value or 'transparent') */
  bg: string;
  /** Scale multiplier: 1 = 8px, 2 = 16px, 3 = 24px, 4 = 32px */
  scale: 1 | 2 | 3 | 4;

  // ── Dark mode mouse-follower glow ──
  glowEnabled: boolean;
  /** Gradient shape: circle or ellipse */
  glowShape: 'circle' | 'ellipse';
  /** Color at the cursor center */
  glowCenter: string;
  /** Mid-tone color between center and edge */
  glowMid: string;
  /** Base color when cursor is away (muted) */
  glowBase: string;
  /** Radius of the glow in px */
  glowRadius: number;
  /** Where the mid color sits (% of radius) */
  glowMidStop: number;
}

export type CodeFormat = 'jsx' | 'css' | 'tailwind';

export interface PlaygroundPreset {
  name: string;
  description: string;
  state: PatternPlaygroundState;
}
