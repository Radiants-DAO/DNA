/**
 * BoxShadowsSection Component
 *
 * Controls for box-shadow with support for multiple layers.
 * Extracted from Effects section for better organization.
 */

import type { BaseSectionProps } from "./types";

export function BoxShadowsSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Box Shadow</label>
        <input
          type="text"
          defaultValue="0 2px 8px rgba(0,0,0,0.25)"
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
        />
      </div>
      <div className="text-[10px] text-text-muted/70">
        Layered shadow editor coming in Phase 2.
      </div>
    </div>
  );
}

export default BoxShadowsSection;
