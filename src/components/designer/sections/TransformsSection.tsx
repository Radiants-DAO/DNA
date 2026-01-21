/**
 * TransformsSection Component
 *
 * Controls for CSS transforms (translate, rotate, scale, skew).
 */

import type { BaseSectionProps } from "./types";

export function TransformsSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-muted py-2">
        Transform controls (translate, rotate, scale, skew) coming in Phase 2.
      </div>
    </div>
  );
}

export default TransformsSection;
