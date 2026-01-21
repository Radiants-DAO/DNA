/**
 * BackdropFilterSection Component
 *
 * Controls for CSS backdrop-filter property (blur, brightness, etc. applied to the backdrop).
 */

import type { BaseSectionProps } from "./types";

export function BackdropFilterSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
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
    </div>
  );
}

export default BackdropFilterSection;
