/**
 * BackgroundsSection Component (renamed from ColorsSection)
 *
 * Controls for background and text color.
 * Uses design tokens when available.
 */

import type { BaseSectionProps } from "./types";

export function BackgroundsSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Background</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-primary border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--primary)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Text Color</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-text border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--text)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
    </div>
  );
}

// Also export as ColorsSection for backward compatibility
export const ColorsSection = BackgroundsSection;

export default BackgroundsSection;
