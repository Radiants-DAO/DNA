/**
 * BoxShadowsSection Component
 *
 * Dedicated section for box-shadow editing using the ShadowEditor.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import { ShadowEditor } from "../ShadowEditor";
import type { LayersValue, ShadowValue } from "../../../types/styleValue";
import { createEmptyLayers, createShadow } from "../../../utils/layersValue";
import { parseBoxShadow } from "../boxShadowParser";
import type { BaseSectionProps } from "./types";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

/** Parse CSS color string to {r, g, b, alpha} for createShadow. */
function parseColorToRgb(color: string): { r: number; g: number; b: number; alpha: number } {
  const el = document.createElement('div');
  el.style.color = color;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      alpha: match[4] ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, alpha: 0.1 };
}

/** Convert ParsedBoxShadow[] to LayersValue using createShadow helper. */
function parsedShadowsToLayers(parsed: ReturnType<typeof parseBoxShadow>): LayersValue {
  const shadows: ShadowValue[] = parsed.map(s =>
    createShadow({
      offsetX: s.offsetX,
      offsetY: s.offsetY,
      blur: s.blur,
      spread: s.spread,
      color: parseColorToRgb(s.color),
      inset: s.inset,
    })
  );
  return { type: "layers", value: shadows };
}

export function BoxShadowsSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Local state for shadow layers
  const [shadowLayers, setShadowLayers] = useState<LayersValue>(() => createEmptyLayers());

  // Hydrate from initialStyles when element is selected
  useEffect(() => {
    if (initialStyles?.boxShadow && typeof initialStyles.boxShadow === 'string') {
      const parsed = parseBoxShadow(initialStyles.boxShadow);
      if (parsed.length > 0) {
        setShadowLayers(parsedShadowsToLayers(parsed));
        return;
      }
    }
    // No shadow or 'none' — clear stale state from previous element
    setShadowLayers(createEmptyLayers());
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
