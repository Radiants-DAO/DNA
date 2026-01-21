/**
 * Section Registry and Exports
 *
 * Central registry for all style panel sections.
 * Phase 1: Extract original 8 sections to separate files.
 */

import type { SectionConfig, SectionId } from "./types";

// Section component imports
import { LayoutSection } from "./LayoutSection";
import { SpacingSection } from "./SpacingSection";
import { SizeSection } from "./SizeSection";
import { PositionSection } from "./PositionSection";
import { TypographySection } from "./TypographySection";
import { BackgroundsSection, ColorsSection } from "./BackgroundsSection";
import { BordersSection } from "./BordersSection";
import { EffectsSection } from "./EffectsSection";

// Re-export all section components
export {
  LayoutSection,
  SpacingSection,
  SizeSection,
  PositionSection,
  TypographySection,
  BackgroundsSection,
  ColorsSection, // Alias for backward compatibility
  BordersSection,
  EffectsSection,
};

// Re-export types
export type { SectionConfig, SectionId, BaseSectionProps } from "./types";

/**
 * Map of section IDs to their React components
 */
export const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  layout: LayoutSection,
  spacing: SpacingSection,
  size: SizeSection,
  position: PositionSection,
  typography: TypographySection,
  backgrounds: BackgroundsSection,
  borders: BordersSection,
  effects: EffectsSection,
};

/**
 * Section configuration registry
 * Defines all sections with their display titles and default state.
 */
export const SECTION_CONFIGS: SectionConfig[] = [
  { id: "layout", title: "Layout", defaultOpen: true },
  { id: "spacing", title: "Spacing", defaultOpen: true },
  { id: "size", title: "Size", defaultOpen: false },
  { id: "position", title: "Position", defaultOpen: false },
  { id: "typography", title: "Typography", defaultOpen: false },
  { id: "backgrounds", title: "Colors", defaultOpen: true },
  { id: "borders", title: "Borders", defaultOpen: false },
  { id: "effects", title: "Effects", defaultOpen: false },
];

/**
 * Get a section component by ID
 * @param id - Section ID
 * @returns Section component or undefined
 */
export function getSectionComponent(id: SectionId): React.ComponentType | undefined {
  return SECTION_COMPONENTS[id];
}
