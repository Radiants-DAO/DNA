import type { IconInventoryIcon } from '@/lib/icon-inventory';

export interface IconMappingDraft {
  readonly source24Name: string;
  readonly target16Name: string;
}

export interface IconMappingState {
  readonly show21: boolean;
  readonly show16: boolean;
  readonly mapMode: boolean;
  readonly source24Name: string | null;
  readonly target16Name: string | null;
  readonly mappings: readonly IconMappingDraft[];
}

export function getInitialIconMappingState(): IconMappingState {
  return {
    show21: true,
    show16: true,
    mapMode: false,
    source24Name: null,
    target16Name: null,
    mappings: [],
  };
}

export function isIconMappingModeActive(state: IconMappingState): boolean {
  return state.show21 && state.show16 && state.mapMode;
}

export function filterIconMappingEntries(
  entries: readonly IconInventoryIcon[],
  state: Pick<IconMappingState, 'show21' | 'show16'>,
): readonly IconInventoryIcon[] {
  return entries.filter((entry) => {
    if (entry.size === 24) return state.show21;
    return state.show16;
  });
}

export function applyIconMappingSelection(
  state: IconMappingState,
  icon: IconInventoryIcon,
): IconMappingState {
  if (!isIconMappingModeActive(state)) {
    return state;
  }

  const nextSource24Name = icon.size === 24 ? icon.name : state.source24Name;
  const nextTarget16Name = icon.size === 16 ? icon.name : state.target16Name;
  const shouldRecord = Boolean(nextSource24Name && nextTarget16Name);

  return {
    ...state,
    source24Name: nextSource24Name,
    target16Name: nextTarget16Name,
    mappings: shouldRecord
      ? upsertMapping(state.mappings, {
          source24Name: nextSource24Name!,
          target16Name: nextTarget16Name!,
        })
      : state.mappings,
  };
}

function upsertMapping(
  mappings: readonly IconMappingDraft[],
  next: IconMappingDraft,
): readonly IconMappingDraft[] {
  const withoutExisting = mappings.filter(
    (mapping) => mapping.source24Name !== next.source24Name,
  );

  return [...withoutExisting, next].sort((a, b) =>
    a.source24Name.localeCompare(b.source24Name),
  );
}

export function formatIconMappingPatch(mappings: readonly IconMappingDraft[]): string {
  if (mappings.length === 0) {
    return [
      'export const ICON_24_TO_16_PATCH = {',
      '  // Select a 21px icon, then a 16px icon.',
      '} as const;',
    ].join('\n');
  }

  return [
    'export const ICON_24_TO_16_PATCH = {',
    ...mappings.map(
      (mapping) => `  '${mapping.source24Name}': '${mapping.target16Name}',`,
    ),
    '} as const;',
  ].join('\n');
}
