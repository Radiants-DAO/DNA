import { componentData } from '../schemas';
import { componentMap } from './component-map';
import { displayMeta } from './component-display-meta';
import { overrides } from './registry.overrides';
import type { RegistryEntry, VariantDemo, ComponentCategory, RenderMode } from './types';

/**
 * Generate variant demos from enum props in schema.json.
 * For each prop with `type: "enum"` and `values: [...]`, creates
 * one VariantDemo per value.
 */
function generateVariantsFromSchema(
  props: Record<string, { type?: string; values?: string[]; default?: unknown }>
): VariantDemo[] {
  const enumProps = Object.entries(props).filter(
    ([, def]) => def.type === 'enum' && Array.isArray(def.values)
  );

  if (enumProps.length === 0) return [];

  // Use 'variant' prop if available, otherwise first enum
  const [propName, propDef] = enumProps.find(([k]) => k === 'variant') ?? enumProps[0];
  const values = propDef.values ?? [];

  return values.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    props: { [propName]: value },
  }));
}

/**
 * Build the full registry from schema data + component map + display meta + overrides.
 */
export function buildRegistry(): RegistryEntry[] {
  const entries: RegistryEntry[] = [];

  for (const [name, data] of Object.entries(componentData)) {
    const map = componentMap[name];
    if (!map) continue;

    const meta = displayMeta[name];
    if (meta?.exclude) continue;

    const override = overrides[name];

    const schema = data.schema as {
      name: string;
      description?: string;
      props?: Record<string, { type?: string; values?: string[]; default?: unknown }>;
    };

    const category: ComponentCategory = meta?.category ?? 'layout';
    const description = schema.description ?? '';

    // Determine render mode: override > meta > default 'inline'
    const renderMode: RenderMode = override?.renderMode ?? meta?.renderMode ?? 'inline';

    // Auto-generate variants from enum props, unless overridden
    const autoVariants = schema.props
      ? generateVariantsFromSchema(schema.props)
      : [];

    const entry: RegistryEntry = {
      name: schema.name ?? name,
      category,
      description,
      sourcePath: map.sourcePath,
      schemaPath: map.schemaPath,
      renderMode,
      // Always expose component ref — even for custom-rendered entries the
      // raw component is used by the playground to render curated variants.
      component: map.component as any,
      // Use curated variants when provided. For inline entries, fall back to
      // auto-generated enum variants. For custom entries, only use auto-variants
      // when the override explicitly opts in (non-empty array), since most
      // custom components are compound/controlled and can't render via simple
      // prop spreading.
      variants: override?.variants
        ?? (renderMode === 'inline' && autoVariants.length > 0
          ? autoVariants
          : undefined),
      Demo: override?.Demo,
      exampleProps: override?.exampleProps ?? meta?.exampleProps,
      tags: [...(meta?.tags ?? []), ...(override?.tags ?? [])],
    };

    entries.push(entry);
  }

  // Sort by category then name
  entries.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  return entries;
}
