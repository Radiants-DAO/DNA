import { prepareCornerRecipe } from './corners/prepare.js';
import { materializeCornerRecipe } from './corners/runtime.js';
import type {
  CornerMap,
  CornerValue,
  EdgeFlags,
  PxConfigCanonical,
} from './corners/types.js';

export interface PxOptions {
  edges?: EdgeFlags;
  color?: string;
}

export type PxConfig = PxConfigCanonical;

export interface PxProps {
  className: string;
  style: Record<string, string>;
}

interface ParsedPxConfig {
  corners: CornerMap<CornerValue>;
  edges?: EdgeFlags;
  color?: string;
  themeShape?: PxConfigCanonical['themeShape'];
}

function isObjectConfig(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalConfig(value: unknown): value is PxConfigCanonical {
  return isObjectConfig(value) && 'corners' in value;
}

function parseConfig(config: PxConfig): ParsedPxConfig {
  if (!isObjectConfig(config)) {
    throw new Error('px() expects a config object');
  }

  if (isCanonicalConfig(config)) {
    return {
      corners: config.corners,
      edges: config.edges,
      color: config.color,
      themeShape: config.themeShape,
    };
  }

  throw new Error('px() expects a config object with corners');
}

export function px(config: PxConfig): PxProps {
  const parsed = parseConfig(config);
  const prepared = prepareCornerRecipe({
    corners: parsed.corners,
    edges: parsed.edges,
  });
  const style = materializeCornerRecipe(prepared, {
    themeShape: parsed.themeShape,
  });

  if (parsed.color) {
    style['--color-line'] = parsed.color;
  }

  return {
    className: 'pixel-corner',
    style,
  };
}
