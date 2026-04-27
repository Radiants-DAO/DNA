import { BUILT_IN_CORNER_GENERATORS } from './authoring/generators.js';
import type {
  CornerDefinition,
  CornerGeneratorDefinition,
  CornerOverrideDefinition,
  CornerShapeName,
} from './types.js';

const generators = new Map<CornerShapeName, CornerGeneratorDefinition>(
  Array.from(BUILT_IN_CORNER_GENERATORS, ([shape, rasterizeGrid]) => [
    shape,
    {
      kind: 'generator',
      shape,
      rasterize(radiusPx) {
        return rasterizeGrid(radiusPx + 1);
      },
    },
  ]),
);
const overrides: CornerOverrideDefinition[] = [];
let overrideVersion = 0;

function bumpOverrideVersion() {
  overrideVersion += 1;
}

function ensureValidRadius(radiusPx: number, shape: CornerShapeName) {
  if (!Number.isInteger(radiusPx) || radiusPx < 1) {
    throw new Error(`${shape}: radiusPx must be an integer >= 1, got ${radiusPx}`);
  }
}

export function registerCornerDefinition(definition: CornerDefinition): () => void {
  if (definition.kind === 'generator') {
    const previous = generators.get(definition.shape);
    generators.set(definition.shape, definition);
    bumpOverrideVersion();

    return () => {
      if (previous) {
        generators.set(definition.shape, previous);
      } else {
        generators.delete(definition.shape);
      }
      bumpOverrideVersion();
    };
  }

  overrides.push(definition);
  bumpOverrideVersion();

  return () => {
    const index = overrides.indexOf(definition);
    if (index >= 0) {
      overrides.splice(index, 1);
      bumpOverrideVersion();
    }
  };
}

export function getCornerOverrideVersion() {
  return overrideVersion;
}

export function resolveCornerOverride(
  shape: CornerShapeName,
  radiusPx: number,
) {
  for (let index = overrides.length - 1; index >= 0; index -= 1) {
    const definition = overrides[index];
    if (definition.shape !== shape) {
      continue;
    }

    const match = definition.match(radiusPx);
    if (match) {
      return match;
    }
  }

  return null;
}

export function resolveCornerDefinition(
  shape: CornerShapeName,
  radiusPx: number,
) {
  ensureValidRadius(radiusPx, shape);

  const override = resolveCornerOverride(shape, radiusPx);
  if (override) {
    return {
      source: 'override' as const,
      cornerSet: override,
    };
  }

  const generator = generators.get(shape);
  if (!generator) {
    throw new Error(
      `Unknown corner shape "${shape}". Available: ${listCornerShapeNames().join(', ')}`,
    );
  }

  return {
    source: 'math' as const,
    cornerSet: generator.rasterize(radiusPx),
  };
}

export function generateShape(shape: CornerShapeName, gridSize: number) {
  if (!Number.isInteger(gridSize) || gridSize < 2) {
    throw new Error(`${shape}: gridSize must be an integer >= 2, got ${gridSize}`);
  }

  return resolveCornerDefinition(shape, gridSize - 1).cornerSet;
}

export function listCornerShapeNames(): CornerShapeName[] {
  return [
    ...new Set([
      ...generators.keys(),
      ...overrides.map((definition) => definition.shape),
    ]),
  ];
}
