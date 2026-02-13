/**
 * BoxShadowsSection Component
 *
 * Dedicated section for box-shadow editing using the ShadowEditor.
 * Separated from EffectsSection per the Webstudio architecture.
 *
 * Part of fn-2-gnc.6: Build Shadow and Gradient Editors
 */

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { ShadowEditor } from "../ShadowEditor";
import type { LayersValue } from "../../../types/styleValue";
import { createEmptyLayers, layersToBoxShadowCss } from "../../../utils/layersValue";
import type { BaseSectionProps } from "./types";

export function BoxShadowsSection(_props: BaseSectionProps) {
  const { selectedEntry, addStyleEdit } = useAppStore();

  // Local state for shadow layers
  const [shadowLayers, setShadowLayers] = useState<LayersValue>(() => createEmptyLayers());

  // Sync with selected element (future: read from computed styles)
  useEffect(() => {
    if (!selectedEntry) {
      setShadowLayers(createEmptyLayers());
      return;
    }
    // TODO: Parse box-shadow from computed styles when available
  }, [selectedEntry?.radflowId]);

  // Handle shadow change
  const handleShadowChange = useCallback(
    (newLayers: LayersValue) => {
      const oldCss = layersToBoxShadowCss(shadowLayers);
      setShadowLayers(newLayers);
      const newCss = layersToBoxShadowCss(newLayers);

      // Only add edit if value actually changed
      if (oldCss !== newCss && selectedEntry?.source) {
        addStyleEdit({
          radflowId: selectedEntry.radflowId,
          componentName: selectedEntry.name,
          source: selectedEntry.source,
          property: "box-shadow",
          oldValue: oldCss || "none",
          newValue: newCss || "none",
        });
      }
    },
    [shadowLayers, selectedEntry, addStyleEdit]
  );

  return (
    <div className="space-y-3">
      <ShadowEditor
        value={shadowLayers}
        onChange={handleShadowChange}
        disabled={!selectedEntry}
      />

      {!selectedEntry && (
        <p className="text-xs text-text-muted text-center py-2">
          Select an element to edit its shadows
        </p>
      )}
    </div>
  );
}

export default BoxShadowsSection;
