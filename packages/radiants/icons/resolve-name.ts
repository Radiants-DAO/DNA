/**
 * Pure icon-name resolution.
 *
 * Takes a user-facing icon name (which may be a canonical name, an alias, or a
 * size-specific preferred name) plus a requested icon set, and returns the
 * canonical name + set that should be looked up in the bitmap registry.
 *
 * This logic is extracted from `resolve-icon.ts` so it can be reused without
 * dragging in the generated SVG importer maps.
 */

import { resolveIconRequest } from './resolve-icon';
import type { IconSet } from './types';

export interface ResolvedIconRequest {
  readonly resolvedName: string;
  readonly resolvedSet: IconSet;
}

/**
 * Resolve a user-supplied icon name + requested set to the canonical
 * name/set pair used by the generated registries.
 *
 * Rules (behaviour preserved from the original `resolveIconRequest`):
 *
 * 1. Unknown names pass through as-is, clamped to the 16px set.
 * 2. When the caller asks for 24px and the manifest entry exposes a
 *    `preferredLargeName`, use that name at 24px.
 * 3. Otherwise, if the entry has a `preferredSmallName`, use that name at 16px.
 * 4. If the icon only has a 24px SVG importer, fall forward to that renderable
 *    asset rather than returning a missing 16px name/set pair.
 * 5. Last resort: return the incoming name at 16px.
 */
export function resolveIconName(
  name: string,
  requestedSet: IconSet,
): ResolvedIconRequest {
  const { resolvedName, resolvedSet } = resolveIconRequest(name, requestedSet);

  return { resolvedName, resolvedSet };
}
