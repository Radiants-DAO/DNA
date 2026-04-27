import { bitsToMaskURI, bitsToPath } from '../path.ts';
import { getPixelIconDefinition, pixelIconRegistry } from './registry.ts';
import type { PixelIconName } from './registry.ts';
import type { PreparedPixelIcon } from './types.ts';

const preparedPixelIconCache = new Map<PixelIconName, PreparedPixelIcon>();

function buildPreparedPixelIcon(name: PixelIconName): PreparedPixelIcon {
  const definition = getPixelIconDefinition(name);

  if (!definition) {
    throw new Error(`Unknown pixel icon: ${name}`);
  }

  const path = bitsToPath(definition.bits, definition.width, definition.height);

  return {
    ...definition,
    path,
    maskImage: bitsToMaskURI(path, definition.width, definition.height),
  };
}

export function preparePixelIcon(name: string): PreparedPixelIcon | undefined {
  const definition = getPixelIconDefinition(name);

  if (!definition) {
    return undefined;
  }

  const cached = preparedPixelIconCache.get(definition.name);

  if (cached) {
    return cached;
  }

  const prepared = buildPreparedPixelIcon(definition.name);
  preparedPixelIconCache.set(definition.name, prepared);
  return prepared;
}

export function preparePixelIconRegistry(): readonly PreparedPixelIcon[] {
  return pixelIconRegistry.map((entry) => preparePixelIcon(entry.name)!);
}
