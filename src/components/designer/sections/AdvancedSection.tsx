/**
 * AdvancedSection Component
 *
 * Advanced CSS properties and raw CSS input for power users.
 */

import type { BaseSectionProps } from "./types";

export function AdvancedSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
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
      <div>
        <label className="text-xs text-text-muted block mb-1">Cursor</label>
        <select className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text">
          <option value="auto">Auto</option>
          <option value="default">Default</option>
          <option value="pointer">Pointer</option>
          <option value="text">Text</option>
          <option value="move">Move</option>
          <option value="not-allowed">Not Allowed</option>
          <option value="grab">Grab</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Pointer Events</label>
        <select className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text">
          <option value="auto">Auto</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  );
}

export default AdvancedSection;
