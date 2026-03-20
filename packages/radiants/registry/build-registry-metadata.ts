import { componentData } from '../schemas';
import { componentPaths } from './component-paths';
import { displayMeta } from './component-display-meta';
import { componentMetaIndex } from '../meta/index';
import type { RegistryMetadataEntry, VariantDemo, ComponentCategory, RenderMode } from './types';

/**
 * Auto-generate variant demos from enum props in schema.json.
 */
function generateVariantsFromSchema(
  props: Record<string, { type?: string; values?: string[]; enum?: string[]; default?: unknown }>
): VariantDemo[] {
  const enumProps = Object.entries(props).filter(
    ([, def]) =>
      (def.type === 'enum' && Array.isArray(def.values)) ||
      (def.type === 'string' && Array.isArray(def.enum))
  );
  if (enumProps.length === 0) return [];
  const [propName, propDef] = enumProps.find(([k]) => k === 'variant') ?? enumProps[0];
  const values = propDef.values ?? propDef.enum ?? [];
  return values.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    props: { [propName]: value },
  }));
}

/**
 * Build server-safe metadata for all Radiants components.
 *
 * Precedence:
 *   1. Canonical: component has a *.meta.ts and appears in meta/index.ts (generated)
 *   2. Fallback: existing component-display-meta.ts + component-paths.ts + schemas (migration glue)
 *
 * The fallback is narrow migration glue and will be deleted once all components
 * are migrated to co-located *.meta.ts files (Task 9).
 */
export function buildRegistryMetadata(): RegistryMetadataEntry[] {
  const entries: RegistryMetadataEntry[] = [];

  for (const [name, data] of Object.entries(componentData)) {
    const paths = componentPaths[name];
    if (!paths) continue;

    const meta = displayMeta[name];
    if (meta?.exclude) continue;

    const schema = data.schema as {
      name: string;
      description?: string;
      props?: Record<string, { type?: string; values?: string[]; enum?: string[]; default?: unknown }>;
    };

    // ── Canonical path (migrated components) ──────────────────────────────
    const canonicalEntry = componentMetaIndex[name as keyof typeof componentMetaIndex];
    if (canonicalEntry) {
      const { registry: reg } = canonicalEntry.meta as { registry?: {
        category?: ComponentCategory;
        renderMode?: RenderMode;
        exampleProps?: Record<string, unknown>;
        variants?: VariantDemo[];
        controlledProps?: string[];
        tags?: string[];
        states?: import('./types').ForcedState[];
        exclude?: boolean;
      }};

      if (reg?.exclude) continue;

      const autoVariants = schema.props ? generateVariantsFromSchema(schema.props) : [];

      entries.push({
        packageName: '@rdna/radiants',
        name: schema.name ?? name,
        category: reg?.category ?? meta?.category ?? 'layout',
        description: schema.description ?? '',
        // Use paths from componentMetaIndex (repo-root-relative), fall back to componentPaths
        sourcePath: canonicalEntry.sourcePath ?? paths.sourcePath,
        schemaPath: canonicalEntry.schemaPath,
        renderMode: reg?.renderMode ?? meta?.renderMode ?? 'inline',
        exampleProps: reg?.exampleProps ?? meta?.exampleProps,
        variants: reg?.variants ?? (reg?.renderMode !== 'custom' && autoVariants.length > 0 ? autoVariants : undefined),
        controlledProps: reg?.controlledProps ?? meta?.controlledProps,
        tags: [...(meta?.tags ?? []), ...(reg?.tags ?? [])],
        states: reg?.states,
      });
      continue;
    }

    // ── Fallback path (unmigrated components — migration glue only) ───────
    const autoVariants = schema.props ? generateVariantsFromSchema(schema.props) : [];
    const renderMode: RenderMode = meta?.renderMode ?? 'inline';

    entries.push({
      packageName: '@rdna/radiants',
      name: schema.name ?? name,
      category: meta?.category ?? 'layout',
      description: schema.description ?? '',
      sourcePath: paths.sourcePath,
      schemaPath: paths.schemaPath,
      renderMode,
      exampleProps: meta?.exampleProps,
      variants: meta?.variants ?? (renderMode === 'inline' && autoVariants.length > 0 ? autoVariants : undefined),
      controlledProps: meta?.controlledProps,
      tags: meta?.tags ?? [],
    });
  }

  entries.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  return entries;
}
