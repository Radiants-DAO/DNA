/**
 * Section Registry and Exports
 *
 * Central registry for all style panel sections with context-aware visibility.
 * This file exports all section components and provides the registry for
 * the RightPanel to use.
 */

import type { SectionConfig, SectionContext, SectionId } from "./types";
import { isFlexDisplay, isGridDisplay } from "./types";

// Section component imports
import { LayoutSection } from "./LayoutSection";
import { FlexChildSection } from "./FlexChildSection";
import { GridChildSection } from "./GridChildSection";
import { SpacingSection } from "./SpacingSection";
import { SizeSection } from "./SizeSection";
import { PositionSection } from "./PositionSection";
import { TypographySection } from "./TypographySection";
import { BackgroundsSection, ColorsSection } from "./BackgroundsSection";
import { BordersSection } from "./BordersSection";
import { OutlineSection } from "./OutlineSection";
import { BoxShadowsSection } from "./BoxShadowsSection";
import { FilterSection } from "./FilterSection";
import { BackdropFilterSection } from "./BackdropFilterSection";
import { TransitionsSection } from "./TransitionsSection";
import { TransformsSection } from "./TransformsSection";
import { AdvancedSection } from "./AdvancedSection";
import { EffectsSection } from "./EffectsSection";

// Re-export all section components
export {
  LayoutSection,
  FlexChildSection,
  GridChildSection,
  SpacingSection,
  SizeSection,
  PositionSection,
  TypographySection,
  BackgroundsSection,
  ColorsSection, // Alias for backward compatibility
  BordersSection,
  OutlineSection,
  BoxShadowsSection,
  FilterSection,
  BackdropFilterSection,
  TransitionsSection,
  TransformsSection,
  AdvancedSection,
  EffectsSection,
};

// Re-export types
export type { SectionConfig, SectionContext, SectionId, BaseSectionProps } from "./types";

/**
 * Map of section IDs to their React components
 */
export const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  layout: LayoutSection,
  flexChild: FlexChildSection,
  gridChild: GridChildSection,
  spacing: SpacingSection,
  size: SizeSection,
  position: PositionSection,
  typography: TypographySection,
  backgrounds: BackgroundsSection,
  borders: BordersSection,
  outline: OutlineSection,
  boxShadows: BoxShadowsSection,
  filter: FilterSection,
  backdropFilter: BackdropFilterSection,
  transitions: TransitionsSection,
  transforms: TransformsSection,
  advanced: AdvancedSection,
  effects: EffectsSection,
};

/**
 * Section configuration registry
 * Defines all sections with their display titles, default state, and visibility rules.
 */
export const SECTION_CONFIGS: SectionConfig[] = [
  // Always visible sections
  { id: "layout", title: "Layout", defaultOpen: true, showWhen: () => true },

  // Context-aware sections (flexChild, gridChild)
  {
    id: "flexChild",
    title: "Flex Child",
    defaultOpen: true,
    showWhen: (ctx: SectionContext) => isFlexDisplay(ctx.parentDisplay),
  },
  {
    id: "gridChild",
    title: "Grid Child",
    defaultOpen: true,
    showWhen: (ctx: SectionContext) => isGridDisplay(ctx.parentDisplay),
  },

  // Always visible sections (continued)
  { id: "spacing", title: "Space", defaultOpen: true, showWhen: () => true },
  { id: "size", title: "Size", defaultOpen: false, showWhen: () => true },
  { id: "position", title: "Position", defaultOpen: false, showWhen: () => true },
  { id: "typography", title: "Typography", defaultOpen: false, showWhen: () => true },
  { id: "backgrounds", title: "Backgrounds", defaultOpen: true, showWhen: () => true },
  { id: "borders", title: "Borders", defaultOpen: false, showWhen: () => true },
  { id: "outline", title: "Outline", defaultOpen: false, showWhen: () => true },
  { id: "boxShadows", title: "Box Shadows", defaultOpen: false, showWhen: () => true },
  { id: "filter", title: "Filter", defaultOpen: false, showWhen: () => true },
  { id: "backdropFilter", title: "Backdrop Filter", defaultOpen: false, showWhen: () => true },
  { id: "transitions", title: "Transitions", defaultOpen: false, showWhen: () => true },
  { id: "transforms", title: "Transforms", defaultOpen: false, showWhen: () => true },
  { id: "advanced", title: "Advanced", defaultOpen: false, showWhen: () => true },
];

/**
 * Legacy section configuration for backward compatibility
 * Maps old 8 section layout to new sections
 */
export const LEGACY_SECTION_CONFIGS: SectionConfig[] = [
  { id: "layout", title: "Layout", defaultOpen: true, showWhen: () => true },
  { id: "spacing", title: "Spacing", defaultOpen: true, showWhen: () => true },
  { id: "size", title: "Size", defaultOpen: false, showWhen: () => true },
  { id: "position", title: "Position", defaultOpen: false, showWhen: () => true },
  { id: "typography", title: "Typography", defaultOpen: false, showWhen: () => true },
  { id: "backgrounds", title: "Colors", defaultOpen: true, showWhen: () => true }, // "Colors" title for backward compat
  { id: "borders", title: "Borders", defaultOpen: false, showWhen: () => true },
  { id: "effects", title: "Effects", defaultOpen: false, showWhen: () => true },
];

/**
 * Get visible sections based on current context
 * @param ctx - Current selection context
 * @param configs - Section configurations to filter (defaults to all sections)
 * @returns Array of visible section configs
 */
export function getVisibleSections(
  ctx: SectionContext,
  configs: SectionConfig[] = SECTION_CONFIGS
): SectionConfig[] {
  return configs.filter((config) => config.showWhen(ctx));
}

/**
 * Get a section component by ID
 * @param id - Section ID
 * @returns Section component or undefined
 */
export function getSectionComponent(id: SectionId): React.ComponentType | undefined {
  return SECTION_COMPONENTS[id];
}
