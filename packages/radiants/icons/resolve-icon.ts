import { ICON_24_IMPORTERS, ICON_IMPORTERS } from './generated-importers';
import { ICON_ALIASES } from './generated-aliases';
import { ICON_16_TO_24, ICON_24_TO_16 } from './size-map';
import type { IconSet } from './types';

type IconImporter = () => Promise<{ default: unknown }>;

const IMPORTERS_BY_SET: Record<IconSet, Record<string, IconImporter>> = {
  16: ICON_IMPORTERS as Record<string, IconImporter>,
  24: ICON_24_IMPORTERS as Record<string, IconImporter>,
};

export function resolveIconRequest(
  name: string,
  requestedSet: IconSet,
): { resolvedName: string; resolvedSet: IconSet } {
  const aliased = ICON_ALIASES[name as keyof typeof ICON_ALIASES] ?? name;

  if (requestedSet === 24) {
    if (aliased in ICON_16_TO_24) {
      return { resolvedName: ICON_16_TO_24[aliased], resolvedSet: 24 };
    }

    if (aliased in ICON_24_TO_16) {
      return { resolvedName: aliased, resolvedSet: 24 };
    }

    return { resolvedName: aliased, resolvedSet: 16 };
  }

  if (aliased in ICON_24_TO_16) {
    return { resolvedName: ICON_24_TO_16[aliased], resolvedSet: 16 };
  }

  return { resolvedName: aliased, resolvedSet: 16 };
}

export function getIconImporter(
  name: string,
  iconSet: IconSet,
): IconImporter | undefined {
  return IMPORTERS_BY_SET[iconSet][name];
}
