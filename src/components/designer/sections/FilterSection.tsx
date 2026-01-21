/**
 * FilterSection Component
 *
 * Controls for CSS filter property (blur, brightness, contrast, grayscale, etc.).
 */

import type { BaseSectionProps } from "./types";

export function FilterSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-muted py-2">
        Filter controls (blur, brightness, contrast, grayscale, etc.) coming in Phase 2.
      </div>
    </div>
  );
}

export default FilterSection;
