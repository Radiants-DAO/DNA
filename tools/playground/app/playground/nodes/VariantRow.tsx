"use client";

import { memo, Suspense } from "react";
import type { ComponentType } from "react";
import type { VariantDemo } from "@rdna/radiants/registry";

interface VariantRowProps {
  variants: VariantDemo[];
  component: ComponentType<Record<string, unknown>>;
}

export const VariantRow = memo(function VariantRow({ variants, component: Comp }: VariantRowProps) {
  return (
    <div className="flex items-end gap-4 border-t border-line px-4 py-3">
      {variants.map((v) => (
        <div
          key={v.label}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <Suspense
            fallback={
              <div className="text-xs text-mute">...</div>
            }
          >
            <Comp {...v.props} />
          </Suspense>
          <span className="text-xs text-mute">{v.label}</span>
        </div>
      ))}
    </div>
  );
});
