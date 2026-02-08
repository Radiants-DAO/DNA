/**
 * BoxShadowsSection Component
 *
 * Dedicated section for box-shadow editing using the ShadowEditor.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import { ShadowEditor } from "../ShadowEditor";
import type { LayersValue } from "../../../types/styleValue";
import { createEmptyLayers } from "../../../utils/layersValue";
import type { BaseSectionProps } from "./types";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

export function BoxShadowsSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Local state for shadow layers
  const [shadowLayers, setShadowLayers] = useState<LayersValue>(() => createEmptyLayers());

  // Initialize from initialStyles if available
  useEffect(() => {
    // In a full implementation, we would parse the boxShadow CSS string
    // into LayersValue. For now, we'll just trigger the effect.
    if (initialStyles?.boxShadow) {
      // TODO: Parse boxShadow string to LayersValue
      // For now, keep existing state
    }
  }, [initialStyles]);

  // Handle shadow change
  const handleShadowChange = useCallback((newLayers: LayersValue) => {
    setShadowLayers(newLayers);
    if (onStyleChange) {
      onStyleChange("boxShadow", newLayers);
    }
  }, [onStyleChange]);

  return (
    <DogfoodBoundary name="BoxShadowsSection" file="designer/sections/BoxShadowsSection.tsx" category="designer">
    <div className="space-y-3">
      <ShadowEditor
        value={shadowLayers}
        onChange={handleShadowChange}
        disabled={false}
      />
    </div>
    </DogfoodBoundary>
  );
}

export default BoxShadowsSection;
