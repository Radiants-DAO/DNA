import type {
  CornerDescriptor,
  CornerMap,
  CornerShapeName,
  CornerValue,
  RequiredCornerMap,
} from './types.js';

export const flatCorner = 0;

export function themedCorner(radiusPx: number): CornerValue {
  return radiusPx === 0
    ? flatCorner
    : {
        radiusPx,
        binding: { source: 'theme' },
      } satisfies CornerDescriptor;
}

export function fixedCorner(shape: CornerShapeName, radiusPx: number): CornerValue {
  return radiusPx === 0
    ? flatCorner
    : {
        radiusPx,
        binding: {
          source: 'fixed',
          shape,
        },
      } satisfies CornerDescriptor;
}

export function cornerMap(
  defaultCorner: CornerValue,
  overrides: CornerMap<CornerValue> = {},
): RequiredCornerMap<CornerValue> {
  return {
    tl: overrides.tl ?? defaultCorner,
    tr: overrides.tr ?? defaultCorner,
    br: overrides.br ?? defaultCorner,
    bl: overrides.bl ?? defaultCorner,
  };
}

export const corner = {
  flat: flatCorner,
  themed: themedCorner,
  fixed: fixedCorner,
  map: cornerMap,
} as const;
