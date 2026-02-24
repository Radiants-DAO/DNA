import { createContext, useContext } from 'react';
import type { ElementHoveredMessage, ElementSelectedMessage, InspectionResult } from '@flow/shared';

export interface InspectionContextValue {
  hoveredElement: ElementHoveredMessage['payload'] | null;
  selectedElement: ElementSelectedMessage['payload'] | null;
  inspectionResult: InspectionResult | null;
  agentGlobals: string[];
  connected: boolean;
  textEditActive: boolean;
  setTextEditActive: (active: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearMutations: () => void;
  /** Apply style changes to the currently selected element */
  applyStyle: (styleChanges: Record<string, string>) => void;
  /** All persistently selected element selectors (multi-selection state). */
  activeSelectors: string[];
}

export const InspectionContext = createContext<InspectionContextValue | null>(null);

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) {
    throw new Error('useInspection must be used within Panel or SidePanel');
  }
  return ctx;
}
