import {
  bitmapIconSource16,
  bitmapIconSource24,
  type BitmapIconEntry,
} from '@rdna/pixel/icons';
import type { PixelGrid } from '@rdna/pixel';
import { ICON_16_TO_24, ICON_24_TO_16 } from '@rdna/radiants/icons';
import type { ReviewAction } from './icon-conversion-review-issues';

export type IconInventorySize = 16 | 24;
export type IconMappingState = 'mapped' | 'unmapped' | 'used' | 'unused';

export const ICON_CATEGORY_PREFIXES = {
  interface: ['interface-essential'],
  devices: [
    'computers-devices-electronics',
    'computers-devices-electronicscd',
    'computers-devices-electronicsmicrochip',
    'computer-old',
    'mobile',
  ],
  coding: ['coding-apps-websites', 'coding-app'],
  files: ['content-files'],
  design: ['design', 'ui-design'],
  email: ['email', 'chat', 'notification', 'send'],
  business: [
    'business-money',
    'business-product',
    'business-products',
    'Business-Products',
    'money-payments',
  ],
  entertainment: ['entertainment-events-hobbies'],
  music: ['music'],
  video: ['video-movies'],
  photography: ['photography'],
  ecology: ['ecology', 'change', 'non-gmo'],
  food: ['food-drink'],
  health: ['health'],
  animals: ['pet-animals'],
  hands: ['hand', 'cursor'],
  users: ['user', 'multiple', 'single', 'search-user'],
  social: ['social-rewards'],
  logos: ['logo'],
  shopping: ['shopping-shipping'],
  'real-estate': ['building-real-eastate', 'real-estate', 'construction'],
  phone: ['phone', 'vintage'],
  network: ['internet-network'],
  navigation: ['map-navigation'],
  weather: ['weather'],
  transportation: ['transportation'],
  travel: ['travel-wayfinding'],
  science: ['school-science'],
  beauty: ['beauty'],
  technology: ['technology'],
  romance: ['romance'],
} as const;

export type IconInventoryCategoryName =
  | keyof typeof ICON_CATEGORY_PREFIXES
  | 'core'
  | 'other';

export interface IconInventoryIcon {
  readonly key: `${IconInventorySize}:${string}`;
  readonly name: string;
  readonly size: IconInventorySize;
  readonly entry: BitmapIconEntry;
  readonly category: IconInventoryCategoryName;
  readonly hasSameNameOtherSize: boolean;
  readonly mappedTo16: string | null;
  readonly mappedTo24: string | null;
  readonly mappedFrom24: readonly string[];
  readonly mappingState: IconMappingState;
}

export interface IconInventoryCategory {
  readonly name: IconInventoryCategoryName;
  readonly prefixes: readonly string[];
  readonly total24: number;
  readonly mapped24: number;
  readonly unmapped24: number;
}

export interface IconInventoryCoverage {
  readonly total16: number;
  readonly total24: number;
  readonly mapped24: number;
  readonly unmapped24: number;
  readonly used16: number;
  readonly unused16: number;
  readonly sharedNames: number;
  readonly missingMapped16Targets: readonly string[];
  readonly missingMapped24Targets: readonly string[];
}

export interface IconInventory {
  readonly icons: readonly IconInventoryIcon[];
  readonly icons16: readonly IconInventoryIcon[];
  readonly icons24: readonly IconInventoryIcon[];
  readonly byKey: ReadonlyMap<string, IconInventoryIcon>;
  readonly byName16: ReadonlyMap<string, IconInventoryIcon>;
  readonly byName24: ReadonlyMap<string, IconInventoryIcon>;
  readonly mapped24: readonly IconInventoryIcon[];
  readonly unmapped24: readonly IconInventoryIcon[];
  readonly used16: readonly IconInventoryIcon[];
  readonly unused16: readonly IconInventoryIcon[];
  readonly categories: readonly IconInventoryCategory[];
  readonly coverage: IconInventoryCoverage;
  readonly maps: {
    readonly icon16To24: Readonly<Record<string, string>>;
    readonly icon24To16: Readonly<Record<string, string>>;
    readonly mapped24NamesBy16Name: ReadonlyMap<string, readonly string[]>;
  };
}

export interface IconReviewEntryLike {
  readonly key: string;
  readonly name: string;
  readonly iconSet: IconInventorySize;
  readonly acceptedIssue?: unknown | null;
}

export interface IconReviewSummary {
  readonly total: number;
  readonly count16: number;
  readonly count24: number;
  readonly delete: number;
  readonly incorrect: number;
  readonly accepted: number;
  readonly implicitOk: number;
}

function iconKey(size: IconInventorySize, name: string): `${IconInventorySize}:${string}` {
  return `${size}:${name}`;
}

function sortByName<T extends { readonly name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

const BITMAP_RECT_RE = /M(\d+),(\d+)h(\d+)v(\d+)h-(\d+)Z/g;

export function bitmapIconEntryToPixelGrid(entry: BitmapIconEntry): PixelGrid {
  const side = entry.size;
  const bits = Array.from({ length: side * side }, () => '0');
  const inset = entry.size === 24 && entry.width === 21 && entry.height === 21 ? 1 : 0;

  for (const match of entry.path.matchAll(BITMAP_RECT_RE)) {
    const x = Number.parseInt(match[1], 10) + inset;
    const y = Number.parseInt(match[2], 10) + inset;
    const width = Number.parseInt(match[3], 10);
    const height = Number.parseInt(match[4], 10);

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        bits[(y + row) * side + x + col] = '1';
      }
    }
  }

  return {
    name: entry.name,
    width: side,
    height: side,
    bits: bits.join(''),
  };
}

export function iconInventoryIconToPixelGrid(icon: IconInventoryIcon): PixelGrid {
  return bitmapIconEntryToPixelGrid(icon.entry);
}

export function buildPixelPlaygroundIconRegistry(
  inventory = buildIconInventory(),
): readonly PixelGrid[] {
  return Object.freeze(
    Array.from(
      new Map(
        [...inventory.icons16, ...inventory.icons24].map((icon) => [
          icon.name,
          iconInventoryIconToPixelGrid(icon),
        ]),
      ).values(),
    ).sort((a, b) => a.name.localeCompare(b.name)),
  ) as readonly PixelGrid[];
}

export function getIconCategory(name: string): IconInventoryCategoryName {
  const normalized = name.toLowerCase();

  for (const [category, prefixes] of Object.entries(ICON_CATEGORY_PREFIXES)) {
    for (const prefix of prefixes) {
      const normalizedPrefix = prefix.toLowerCase();
      if (
        normalized === normalizedPrefix ||
        normalized.startsWith(`${normalizedPrefix}-`)
      ) {
        return category as IconInventoryCategoryName;
      }
    }
  }

  if (!name.includes('-')) {
    return 'core';
  }

  return 'other';
}

function buildMapped24NamesBy16Name(): Map<string, readonly string[]> {
  const next = new Map<string, string[]>();

  for (const [name24, name16] of Object.entries(ICON_24_TO_16)) {
    const mapped = next.get(name16);
    if (mapped) {
      mapped.push(name24);
    } else {
      next.set(name16, [name24]);
    }
  }

  for (const [name16, names24] of next.entries()) {
    names24.sort((a, b) => a.localeCompare(b));
    next.set(name16, names24);
  }

  return next;
}

function buildCategorySummaries(icons24: readonly IconInventoryIcon[]): IconInventoryCategory[] {
  const byCategory = new Map<IconInventoryCategoryName, IconInventoryIcon[]>();

  for (const icon of icons24) {
    const icons = byCategory.get(icon.category);
    if (icons) {
      icons.push(icon);
    } else {
      byCategory.set(icon.category, [icon]);
    }
  }

  return [...byCategory.entries()]
    .map(([name, icons]) => {
      const mapped24 = icons.filter((icon) => icon.mappingState === 'mapped').length;
      return {
        name,
        prefixes: name in ICON_CATEGORY_PREFIXES
          ? ICON_CATEGORY_PREFIXES[name as keyof typeof ICON_CATEGORY_PREFIXES]
          : [],
        total24: icons.length,
        mapped24,
        unmapped24: icons.length - mapped24,
      } satisfies IconInventoryCategory;
    })
    .sort((a, b) => {
      if (a.name === 'interface') return -1;
      if (b.name === 'interface') return 1;
      if (a.name === 'core') return -1;
      if (b.name === 'core') return 1;
      if (a.name === 'other') return 1;
      if (b.name === 'other') return -1;
      return a.name.localeCompare(b.name);
    });
}

export function buildIconInventory(): IconInventory {
  const source16 = sortByName(bitmapIconSource16);
  const source24 = sortByName(bitmapIconSource24);
  const names16 = new Set(source16.map((entry) => entry.name));
  const names24 = new Set(source24.map((entry) => entry.name));
  const mapped24NamesBy16Name = buildMapped24NamesBy16Name();

  const icons16 = source16.map((entry): IconInventoryIcon => {
    const mappedFrom24 = mapped24NamesBy16Name.get(entry.name) ?? [];
    const mappedTo24 = ICON_16_TO_24[entry.name] ?? null;

    return {
      key: iconKey(16, entry.name),
      name: entry.name,
      size: 16,
      entry,
      category: mappedTo24 ? getIconCategory(mappedTo24) : getIconCategory(entry.name),
      hasSameNameOtherSize: names24.has(entry.name),
      mappedTo16: null,
      mappedTo24,
      mappedFrom24,
      mappingState: mappedFrom24.length > 0 ? 'used' : 'unused',
    };
  });

  const icons24 = source24.map((entry): IconInventoryIcon => {
    const mappedTo16 = ICON_24_TO_16[entry.name] ?? null;

    return {
      key: iconKey(24, entry.name),
      name: entry.name,
      size: 24,
      entry,
      category: getIconCategory(entry.name),
      hasSameNameOtherSize: names16.has(entry.name),
      mappedTo16,
      mappedTo24: null,
      mappedFrom24: [],
      mappingState: mappedTo16 ? 'mapped' : 'unmapped',
    };
  });

  const icons = [...icons16, ...icons24];
  const byKey = new Map(icons.map((icon) => [icon.key, icon]));
  const byName16 = new Map(icons16.map((icon) => [icon.name, icon]));
  const byName24 = new Map(icons24.map((icon) => [icon.name, icon]));
  const mapped24 = icons24.filter((icon) => icon.mappingState === 'mapped');
  const unmapped24 = icons24.filter((icon) => icon.mappingState === 'unmapped');
  const used16 = icons16.filter((icon) => icon.mappingState === 'used');
  const unused16 = icons16.filter((icon) => icon.mappingState === 'unused');
  const sharedNames = icons16.filter((icon) => icon.hasSameNameOtherSize).length;
  const missingMapped16Targets = Object.values(ICON_24_TO_16)
    .filter((name) => !names16.has(name))
    .sort((a, b) => a.localeCompare(b));
  const missingMapped24Targets = Object.values(ICON_16_TO_24)
    .filter((name) => !names24.has(name))
    .sort((a, b) => a.localeCompare(b));

  return {
    icons,
    icons16,
    icons24,
    byKey,
    byName16,
    byName24,
    mapped24,
    unmapped24,
    used16,
    unused16,
    categories: buildCategorySummaries(icons24),
    coverage: {
      total16: icons16.length,
      total24: icons24.length,
      mapped24: mapped24.length,
      unmapped24: unmapped24.length,
      used16: used16.length,
      unused16: unused16.length,
      sharedNames,
      missingMapped16Targets,
      missingMapped24Targets,
    },
    maps: {
      icon16To24: ICON_16_TO_24,
      icon24To16: ICON_24_TO_16,
      mapped24NamesBy16Name,
    },
  };
}

export function summarizeIconReviewEntries(
  entries: readonly IconReviewEntryLike[],
  decisions: Readonly<Record<string, ReviewAction>> = {},
): IconReviewSummary {
  let count16 = 0;
  let count24 = 0;
  let deleteCount = 0;
  let incorrect = 0;
  let accepted = 0;
  let implicitOk = 0;

  for (const entry of entries) {
    if (entry.iconSet === 16) {
      count16 += 1;
    } else {
      count24 += 1;
    }

    const decision = decisions[entry.key];
    if (decision === 'delete') {
      deleteCount += 1;
    } else if (decision === 'incorrect') {
      incorrect += 1;
    } else if (entry.acceptedIssue) {
      accepted += 1;
    } else {
      implicitOk += 1;
    }
  }

  return {
    total: entries.length,
    count16,
    count24,
    delete: deleteCount,
    incorrect,
    accepted,
    implicitOk,
  };
}
