/**
 * OutlineSection Component
 *
 * Controls for CSS outline properties (outline-style, outline-width, outline-color, outline-offset).
 * Separate from borders as outlines don't affect layout.
 */

import type { BaseSectionProps } from "./types";

export function OutlineSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-muted py-2">
        Outline controls coming soon. Outlines are useful for focus states without affecting layout.
      </div>
    </div>
  );
}

export default OutlineSection;
