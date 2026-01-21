/**
 * TransitionsSection Component
 *
 * Controls for CSS transitions (property, duration, timing function, delay).
 */

import type { BaseSectionProps } from "./types";

export function TransitionsSection(_props: BaseSectionProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-muted py-2">
        Transition controls (property, duration, timing, delay) coming in Phase 2.
      </div>
    </div>
  );
}

export default TransitionsSection;
