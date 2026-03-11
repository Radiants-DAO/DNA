"use client";

import { Suspense } from "react";
import type { ComponentType } from "react";
import type { VariantDef } from "../types";

interface VariantRowProps {
  variants: VariantDef[];
  component: ComponentType<Record<string, unknown>>;
}

export function VariantRow({ variants, component: Comp }: VariantRowProps) {
  return (
    <div className="flex items-end gap-4 overflow-x-auto border-t border-edge-primary px-4 py-3">
      {variants.map((v) => (
        <div
          key={v.label}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <Suspense
            fallback={
              <div className="text-xs text-content-muted">...</div>
            }
          >
            <Comp {...v.props} />
          </Suspense>
          <span className="text-xs text-content-muted">{v.label}</span>
        </div>
      ))}
    </div>
  );
}
