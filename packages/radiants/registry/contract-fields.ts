import type { ComponentMeta } from "@rdna/preview";

export function pickContractFields(meta: ComponentMeta<unknown>) {
  return Object.fromEntries(
    Object.entries({
      replaces: meta.replaces,
      pixelCorners: meta.pixelCorners,
      shadowSystem: meta.shadowSystem,
      styleOwnership: meta.styleOwnership,
      wraps: meta.wraps,
      a11y: meta.a11y,
    }).filter(([, value]) => value !== undefined),
  );
}
