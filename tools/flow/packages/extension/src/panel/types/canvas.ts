/**
 * Shared Canvas Core Types
 *
 * Ported from Flow 0 for Component Canvas support.
 */

// ============================================================================
// Physics Types
// ============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface VelocitySample {
  velocity: Vector2D;
  timestamp: number;
}

// ============================================================================
// Sound Types
// ============================================================================

export type SoundEffect =
  | "bounce"
  | "gridTouch"
  | "select"
  | "deselect"
  | "expand"
  | "collapse"
  | "copy"
  | "drop";

export interface SoundConfig {
  /** Master volume (0-1) */
  masterVolume: number;
  /** Individual sound volumes */
  volumes: Record<SoundEffect, number>;
  /** Whether sounds are enabled */
  enabled: boolean;
}

export interface UseCanvasSoundsOptions {
  /** Sound configuration */
  config?: Partial<SoundConfig>;
  /** Initially enabled */
  enabled?: boolean;
}

export interface UseCanvasSoundsResult {
  /** Play a sound effect */
  play: (effect: SoundEffect, options?: { volume?: number }) => void;
  /** Enable/disable sounds */
  setEnabled: (enabled: boolean) => void;
  /** Whether sounds are enabled */
  isEnabled: boolean;
  /** Update configuration */
  setConfig: (config: Partial<SoundConfig>) => void;
}

// ============================================================================
// Spring & Grid Types
// ============================================================================

export interface SpringConfig {
  /** Spring stiffness (default: 0.08) */
  stiffness: number;
  /** Spring damping (default: 0.75) */
  damping: number;
}

export interface GridConfig {
  /** Grid cell size in pixels */
  cellSize: number;
  /** Dot radius in pixels */
  dotRadius: number;
  /** Dot color (CSS color string) */
  dotColor: string;
  /** Background color */
  backgroundColor: string;
  /** Enable spring physics on grid */
  enablePhysics: boolean;
  /** Spring configuration for grid */
  spring?: SpringConfig;
}

export interface CanvasGridProps {
  /** Grid configuration */
  config?: Partial<GridConfig>;
  /** Current pan offset */
  offset: Vector2D;
  /** Current zoom scale */
  scale: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** ClassName for styling */
  className?: string;
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  stiffness: 0.08,
  damping: 0.75,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellSize: 24,
  dotRadius: 1,
  dotColor: "rgba(255,255,255,0.15)",
  backgroundColor: "#0a0a0a",
  enablePhysics: false,
  spring: DEFAULT_SPRING_CONFIG,
};

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  masterVolume: 0.5,
  volumes: {
    bounce: 0.1,
    gridTouch: 0.015,
    select: 0.08,
    deselect: 0.05,
    expand: 0.06,
    collapse: 0.06,
    copy: 0.1,
    drop: 0.15,
  },
  enabled: true,
};
