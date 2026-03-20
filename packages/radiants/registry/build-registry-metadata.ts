import { componentMetaIndex } from '../meta/index';
import type {
  RegistryMetadataEntry,
  VariantDemo,
  ComponentCategory,
  RenderMode,
  ForcedState,
} from './types';

/** Internal shape matching what each componentMetaIndex entry carries. */
type IndexEntry = {
  meta: {
    name: string;
    description?: string;
    registry?: {
      category?: ComponentCategory;
      renderMode?: RenderMode;
      exampleProps?: Record<string, unknown>;
      variants?: VariantDemo[];
      controlledProps?: string[];
      tags?: string[];
      states?: ForcedState[];
      exclude?: boolean;
    };
  };
  sourcePath: string | null;
  schemaPath: string;
  dnaPath?: string;
};

/**
 * Build server-safe metadata for all Radiants components.
 *
 * Reads exclusively from the generated `packages/radiants/meta/index.ts` barrel,
 * which is produced by `pnpm --filter @rdna/radiants generate:schemas`.
 * There is no longer a legacy fallback — every component must have a *.meta.ts file.
 */
export function buildRegistryMetadata(): RegistryMetadataEntry[] {
  const entries: RegistryMetadataEntry[] = [];

  for (const [name, data] of Object.entries(componentMetaIndex) as [string, IndexEntry][]) {
    const { meta, sourcePath, schemaPath, dnaPath } = data;
    const reg = meta.registry;

    if (reg?.exclude) continue;

    entries.push({
      packageName: '@rdna/radiants',
      name: meta.name ?? name,
      category: reg?.category ?? 'layout',
      description: meta.description ?? '',
      sourcePath: sourcePath ?? '',
      schemaPath,
      dnaPath: dnaPath ?? null,
      renderMode: reg?.renderMode ?? 'inline',
      exampleProps: reg?.exampleProps,
      variants: reg?.variants,
      controlledProps: reg?.controlledProps,
      tags: reg?.tags ?? [],
      states: reg?.states,
    });
  }

  entries.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  return entries;
}
