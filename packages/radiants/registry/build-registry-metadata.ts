import { componentMetaIndex } from '../meta/index';
import { CATEGORY_LABELS } from './types';
import type {
  RegistryMetadataEntry,
} from './types';
import type { ComponentMeta } from '@rdna/preview';

/** Internal shape matching what each componentMetaIndex entry carries. */
type IndexEntry = {
  meta: ComponentMeta<Record<string, unknown>>;
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
    const componentName = meta.name ?? name;
    const category = reg?.category ?? 'layout';
    const defaultProps = reg?.exampleProps ?? reg?.variants?.[0]?.props ?? {};

    if (reg?.exclude) continue;

    entries.push({
      packageName: '@rdna/radiants',
      name: componentName,
      category,
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
      id: componentName.toLowerCase(),
      label: `${componentName}.tsx`,
      group: CATEGORY_LABELS[category] ?? category,
      props: meta.props ?? {},
      slots: meta.slots ?? {},
      defaultProps,
      tokenBindings: meta.tokenBindings ?? null,
      subcomponents: meta.subcomponents ?? [],
      examples: meta.examples ?? [],
    });
  }

  entries.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  return entries;
}
