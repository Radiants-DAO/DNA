import { componentMetaIndex } from "../../../packages/radiants/meta/index.ts";
import { pickContractFields } from "../../../packages/radiants/registry/contract-fields.ts";
import type {
  A11yContract,
  ComponentMeta,
  ElementReplacement,
  StyleOwnership,
} from "../../../packages/preview/src/index.ts";

export interface RadiantsContractComponent {
  name: string;
  sourcePath: string | null;
  replaces?: ElementReplacement[];
  pixelCorners?: boolean;
  shadowSystem?: "standard" | "pixel";
  styleOwnership?: StyleOwnership[];
  wraps?: string;
  a11y?: A11yContract;
}

type IndexEntry = {
  meta: ComponentMeta<Record<string, unknown>>;
  sourcePath: string | null;
  schemaPath: string;
};

export async function loadRadiantsComponentContracts(): Promise<RadiantsContractComponent[]> {
  return (Object.entries(componentMetaIndex) as [string, IndexEntry][])
    .map(([name, entry]) => ({
      name: entry.meta.name ?? name,
      sourcePath: entry.sourcePath ?? null,
      ...pickContractFields(entry.meta),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
