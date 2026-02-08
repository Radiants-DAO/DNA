/**
 * Designer Components
 *
 * Entry point for all designer panel components.
 * Exports section components and editor utilities.
 *
 * Ported from Flow 0 for the browser extension.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) Flow
 */

// Editor components
export { ColorPicker } from "./ColorPicker";
export type {
  ColorPickerProps,
  ColorValue,
  ColorToken,
  ColorMode,
  InputMode,
} from "./ColorPicker";

export { GradientEditor } from "./GradientEditor";
export type { GradientEditorProps } from "./GradientEditor";

export { ShadowEditor } from "./ShadowEditor";
export type { ShadowEditorProps } from "./ShadowEditor";

// Section components
export {
  LayoutSection,
  SpacingSection,
  SizeSection,
  PositionSection,
  TypographySection,
  BackgroundsSection,
  ColorsSection,
  BordersSection,
  BoxShadowsSection,
  EffectsSection,
  SECTION_COMPONENTS,
  SECTION_CONFIGS,
  getSectionComponent,
} from "./sections";

export type { SectionConfig, SectionId, BaseSectionProps } from "./sections";
