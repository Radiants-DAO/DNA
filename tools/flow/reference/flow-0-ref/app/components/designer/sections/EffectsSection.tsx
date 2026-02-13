/**
 * EffectsSection Component
 *
 * Controls for box shadow, backdrop blur, and opacity.
 * This is a placeholder that will be split into BoxShadowsSection,
 * FilterSection, and other sections in Phase 2.
 */

import type { BaseSectionProps } from "./types";

export function EffectsSection(_props: BaseSectionProps) {
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
      <div>
        <label className="text-xs text-text-muted block mb-1">Backdrop Blur</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="40"
            defaultValue="0"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="0px"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="100%"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

export default EffectsSection;
