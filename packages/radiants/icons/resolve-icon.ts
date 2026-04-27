import { SVG_ICON_IMPORTERS } from './generated-importers';
import { getPreparedSvgIcon } from './manifest';
import type { IconSet } from './types';

type IconImporter = () => Promise<{ default: unknown }>;
const SVG_ICON_IMPORTERS_BY_KEY = SVG_ICON_IMPORTERS as Record<string, IconImporter>;

export interface ResolvedIconRequest {
  readonly resolvedName: string;
  readonly resolvedSet: IconSet;
  readonly importerKey?: string;
}

export function resolveIconRequest(
  name: string,
  requestedSet: IconSet,
): ResolvedIconRequest {
  const icon = getPreparedSvgIcon(name);

  if (!icon) {
    return { resolvedName: name, resolvedSet: 16 };
  }

  if (requestedSet === 24 && icon.preferredLargeName && icon.importerKeys[24]) {
    return {
      resolvedName: icon.preferredLargeName,
      resolvedSet: 24,
      importerKey: icon.importerKeys[24],
    };
  }

  if (icon.preferredSmallName && icon.importerKeys[16]) {
    return {
      resolvedName: icon.preferredSmallName,
      resolvedSet: 16,
      importerKey: icon.importerKeys[16],
    };
  }

  if (icon.preferredLargeName && icon.importerKeys[24]) {
    return {
      resolvedName: icon.preferredLargeName,
      resolvedSet: 24,
      importerKey: icon.importerKeys[24],
    };
  }

  return { resolvedName: name, resolvedSet: 16 };
}

export function getIconImporter(
  name: string,
  iconSet: IconSet,
): IconImporter | undefined {
  const icon = getPreparedSvgIcon(name);
  const importerKey = icon?.importerKeys[iconSet];

  if (!importerKey) {
    return undefined;
  }

  return SVG_ICON_IMPORTERS_BY_KEY[importerKey];
}
