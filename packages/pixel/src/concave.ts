import { prepareCornerProfile } from './corners/prepare.js';
import type { CornerPosition } from './types.js';
import type { CornerShapeName } from './corners/types.js';

const DEFAULT_THEME_SHAPE: CornerShapeName = 'circle';

export interface ConcaveCornerConfig {
  corner: CornerPosition;
  radiusPx: number;
  shape?: CornerShapeName;
  themeShape?: CornerShapeName;
}

export interface ConcaveCornerProps {
  className: string;
  style: Record<string, string>;
}

export function concave(config: ConcaveCornerConfig): ConcaveCornerProps {
  const shape = config.shape ?? config.themeShape ?? DEFAULT_THEME_SHAPE;
  const profile = prepareCornerProfile(shape, config.radiusPx);
  const asset = profile.cover[config.corner];

  return {
    className: `pixel-concave-corner pixel-concave-${config.corner}`,
    style: {
      '--px-concave-mask': asset.maskImage,
      '--px-concave-s': `calc(${profile.gridSize}px * var(--pixel-scale, 1))`,
    },
  };
}
