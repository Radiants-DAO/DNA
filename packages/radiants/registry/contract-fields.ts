import type { ComponentMeta } from "@rdna/preview";

export type ContractFieldSource = Partial<
  Pick<
    ComponentMeta<any>,
    | "name"
    | "description"
    | "props"
    | "replaces"
    | "pixelCorners"
    | "shadowSystem"
    | "styleOwnership"
    | "structuralRules"
    | "density"
    | "composition"
    | "wraps"
    | "a11y"
  >
>;

export function pickContractFields(meta: ContractFieldSource) {
  return Object.fromEntries(
    Object.entries({
      replaces: meta.replaces,
      pixelCorners: meta.pixelCorners,
      shadowSystem: meta.shadowSystem,
      styleOwnership: meta.styleOwnership,
      structuralRules: meta.structuralRules,
      density: meta.density,
      composition: meta.composition,
      wraps: meta.wraps,
      a11y: meta.a11y,
    }).filter(([, value]) => value !== undefined),
  );
}
